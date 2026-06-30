-- Urban Bee Club: initial production schema
-- Run with Supabase CLI (`supabase db push`) or in the SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.hives (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  location text not null default '調布キャンパス',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sensor_readings (
  id bigint generated always as identity primary key,
  ingestion_id uuid,
  hive_id uuid not null references public.hives(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  temperature numeric(5,2) not null check (temperature between -20 and 70),
  humidity numeric(5,2) not null check (humidity between 0 and 100),
  weight numeric(7,2) not null check (weight between 0 and 500),
  activity numeric(5,2) not null check (activity between 0 and 100),
  received_at timestamptz not null default now(),
  unique (hive_id, recorded_at)
);
create index if not exists sensor_readings_hive_time_idx on public.sensor_readings (hive_id, recorded_at desc);
create unique index if not exists sensor_readings_ingestion_id_idx on public.sensor_readings (ingestion_id) where ingestion_id is not null;

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) <= 254),
  affiliation text check (char_length(affiliation) <= 120),
  kind text not null check (kind in ('join','outreach','research','other')),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now()
);
create index if not exists contact_submissions_created_idx on public.contact_submissions (created_at desc);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique check (char_length(stripe_customer_id) between 1 and 255),
  stripe_subscription_id text not null unique check (char_length(stripe_subscription_id) between 1 and 255),
  status text not null check (status in ('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid','paused')),
  current_period_end timestamptz,
  stripe_event_created_at bigint not null default 0 check (stripe_event_created_at >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9-]{5,31}$'),
  stripe_promotion_code_id text not null unique check (char_length(stripe_promotion_code_id) between 1 and 255),
  percentage smallint not null check (percentage between 1 and 50),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique check (char_length(stripe_session_id) between 1 and 255),
  stripe_customer_id text check (char_length(stripe_customer_id) <= 255),
  email text check (char_length(email) <= 254),
  amount_total integer check (amount_total >= 0),
  currency text check (char_length(currency) = 3),
  status text not null check (char_length(status) between 1 and 50),
  items_summary text not null default '' check (char_length(items_summary) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- Contains only an HMAC-derived opaque key, never a raw IP address or email.
create table if not exists public.rate_limit_buckets (
  bucket_key text primary key check (bucket_key ~ '^[a-f0-9]{64}$'),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  check (expires_at > window_started_at)
);
create index if not exists rate_limit_buckets_expires_idx on public.rate_limit_buckets (expires_at);

-- The raw Stripe payload is intentionally not persisted because it may contain PII.
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

alter table public.hives enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.memberships enable row level security;
alter table public.discount_codes enable row level security;
alter table public.orders enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Public pages read through a server-only service client. No anonymous table access.
revoke all on public.hives, public.sensor_readings, public.contact_submissions, public.memberships, public.discount_codes, public.orders from anon;
revoke all on public.hives, public.sensor_readings, public.contact_submissions, public.orders, public.memberships, public.discount_codes from authenticated;
revoke all on public.rate_limit_buckets, public.stripe_webhook_events from anon, authenticated;
grant select, insert, update, delete on public.rate_limit_buckets, public.stripe_webhook_events to service_role;
grant select (user_id, status, current_period_end, created_at, updated_at) on public.memberships to authenticated;
grant select (code, percentage, active, created_at) on public.discount_codes to authenticated;

drop policy if exists "Members can read own membership" on public.memberships;
create policy "Members can read own membership" on public.memberships for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
drop policy if exists "Members can read own discount" on public.discount_codes;
create policy "Members can read own discount" on public.discount_codes for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Atomic cross-instance rate-limit counter. Only service_role may execute it.
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
  if p_bucket_key !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid bucket key';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid rate limit';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit window';
  end if;

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

comment on table public.sensor_readings is 'IoT readings. Writes are only allowed through the authenticated server ingestion endpoint.';
comment on table public.contact_submissions is 'PII. Accessible only with the server service role and Supabase dashboard administrators.';
comment on table public.rate_limit_buckets is 'Opaque HMAC keys used for distributed abuse prevention. No raw client identifier is stored.';
comment on table public.stripe_webhook_events is 'Stripe event processing state for idempotency. Raw event payloads are never stored.';
