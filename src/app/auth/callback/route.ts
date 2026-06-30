import type { NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth";
import { emptyNoStore, redirectNoStore, safeInternalPath } from "@/lib/security";
import { isSalonEnabled, siteConfig } from "@/lib/site";

export async function GET(request: NextRequest) {
  if (!isSalonEnabled()) return emptyNoStore(404);
  const code = request.nextUrl.searchParams.get("code");
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"), ["/salon", "/salon/gallery"], "/salon");
  if (!code || code.length > 2_048) return redirectNoStore(new URL("/salon?auth=failed", siteConfig.url));
  const client = await createAuthClient();
  if (client) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return redirectNoStore(new URL(next, siteConfig.url));
    console.error("Supabase auth callback failed", error.code ?? "provider_error");
  }
  return redirectNoStore(new URL("/salon?auth=failed", siteConfig.url));
}
