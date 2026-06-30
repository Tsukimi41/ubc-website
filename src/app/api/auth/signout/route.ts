import type { NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth";
import { emptyNoStore, jsonNoStore, redirectNoStore, validateBrowserMutation } from "@/lib/security";
import { isSalonEnabled, siteConfig } from "@/lib/site";

export async function POST(request: NextRequest) {
  if (!isSalonEnabled()) return emptyNoStore(404);
  const mutation = validateBrowserMutation(request);
  if (!mutation.ok) return jsonNoStore({ message: mutation.message }, { status: mutation.status });
  const client = await createAuthClient();
  if (!client) return jsonNoStore({ message: "ログアウト機能を利用できません。" }, { status: 503 });
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) console.error("Supabase sign-out failed", error.code ?? "provider_error");
  return redirectNoStore(new URL("/salon", siteConfig.url));
}
