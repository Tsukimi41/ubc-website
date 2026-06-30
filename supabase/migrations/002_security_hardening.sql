-- Security hardening for existing installations of 001_initial_schema.sql.
-- This migration is intentionally idempotent where PostgreSQL supports it.

alter table public.sensor_readings add column if not exists ingestion_id uuid;
create unique index if not exists sensor_readings_ingestion_id_idx
  on public.sensor_readings (ingestion_id)
  where ingestion_id is not null;

alter table public.discount_codes add column if not exists active boolean not null default true;
alter table public.discount_codes drop constraint if exists discount_codes_code_check;
alter table public.discount_codes add constraint discount_codes_code_check
  check (code ~ '^[A-Z0-9][A-Z0-9-]{5,31}$');

alter table public.memberships
  add column if not exists stripe_event_created_at bigint not null default 0;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'memberships_stripe_event_created_nonnegative_check'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      add constraint memberships_stripe_event_created_nonnegative_check
      check (stripe_event_created_at >= 0) not valid;
  end if;
end;
$$;
alter table public.memberships validate constraint memberships_stripe_event_created_nonnegative_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_stripe_ids_length_check' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_stripe_ids_length_check check (
      char_length(stripe_customer_id) between 1 and 255
      and char_length(stripe_subscription_id) between 1 and 255
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'discount_codes_stripe_id_length_check' and conrelid = 'public.discount_codes'::regclass) then
    alter table public.discount_codes add constraint discount_codes_stripe_id_length_check
      check (char_length(stripe_promotion_code_id) between 1 and 255) not valid;
  end if;
end;
$$;
alter table public.memberships validate constraint memberships_stripe_ids_length_check;
alter table public.discount_codes validate constraint discount_codes_stripe_id_length_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_security_lengths_check' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_security_lengths_check check (
      char_length(stripe_session_id) between 1 and 255
      and (stripe_customer_id is null or char_length(stripe_customer_id) <= 255)
      and (email is null or char_length(email) <= 254)
      and char_length(status) between 1 and 50
      and char_length(items_summary) <= 1000
    ) not valid;
  end if;
end;
$$;
alter table public.orders validate constraint orders_security_lengths_check;

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key check (bucket_key ~ '^[a-f0-9]{64}$'),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  check (expires_at > window_started_at)
);
create index if not exists rate_limit_buckets_expires_idx on public.rate_limit_buckets (expires_at);

create table if not exists public.stripe_webhook_events (
  event_id text primary key check (char_length(event_id) between 1 and 255),
  event_type text not null check (char_length(event_type) between 1 and 120),
  livemode boolean not null,
  status text not null check (status in ('processing','completed','failed')),
  attempts integer not null default 1 check (attempts > 0),
  processing_started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text check (char_length(error_code) <= 120),
  updated_at timestamptz not null default now()
);
create index if not exists stripe_webhook_events_status_idx on public.stripe_webhook_events (status, updated_at);

alter table public.rate_limit_buckets enable row level security;
alter table public.stripe_webhook_events enable row level security;
revoke all on public.rate_limit_buckets, public.stripe_webhook_events from anon, authenticated;
grant select, insert, update, delete on public.rate_limit_buckets, public.stripe_webhook_events to service_role;
revoke all on public.memberships, public.discount_codes from authenticated;
grant select (user_id, status, current_period_end, created_at, updated_at) on public.memberships to authenticated;
grant select (code, percentage, active, created_at) on public.discount_codes to authenticated;

drop policy if exists "Members can read own membership" on public.memberships;
create policy "Members can read own membership"
  on public.memberships for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Members can read own discount" on public.discount_codes;
create policy "Members can read own discount"
  on public.discount_codes for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_expires timestamptz;
begin
  if p_bucket_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid bucket key'; end if;
  if p_limit < 1 or p_limit > 10000 then raise exception 'invalid rate limit'; end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then raise exception 'invalid rate-limit window'; end if;

  insert into public.rate_limit_buckets as bucket (
    bucket_key, request_count, window_started_at, expires_at, updated_at
  ) values (
    p_bucket_key, 1, v_now, v_now + make_interval(secs => p_window_seconds), v_now
  )
  on conflict (bucket_key) do update set
    request_count = case when bucket.expires_at <= v_now then 1 else bucket.request_count + 1 end,
    window_started_at = case when bucket.expires_at <= v_now then v_now else bucket.window_started_at end,
    expires_at = case when bucket.expires_at <= v_now then v_now + make_interval(secs => p_window_seconds) else bucket.expires_at end,
    updated_at = v_now
  returning request_count, expires_at into v_count, v_expires;

  return query select
    v_count <= p_limit,
    greatest(0, p_limit - v_count),
    greatest(1, ceil(extract(epoch from (v_expires - v_now)))::integer);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

comment on table public.rate_limit_buckets is 'Opaque HMAC keys used for distributed abuse prevention. No raw client identifier is stored.';
comment on table public.stripe_webhook_events is 'Stripe event processing state for idempotency. Raw event payloads are never stored.';
