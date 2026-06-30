import { createClient } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { ConfigurationError, getSupabaseSettings } from "@/lib/server-config";
import { emptyNoStore, jsonNoStore, readJsonWithLimit, validateBrowserMutation } from "@/lib/security";
import { isSalonEnabled, siteConfig } from "@/lib/site";

export async function POST(request: NextRequest) {
  if (!isSalonEnabled()) return emptyNoStore(404);
  const mutation = validateBrowserMutation(request);
  if (!mutation.ok) return jsonNoStore({ message: mutation.message }, { status: mutation.status });

  const ipLimit = await consumeRateLimit(request, "magic-link:ip", { limit: 5, windowSeconds: 3_600 });
  if (!ipLimit.available) return jsonNoStore({ message: "ログイン機能は現在利用できません。" }, { status: 503 });
  if (!ipLimit.allowed) return jsonNoStore({ message: "しばらく待ってお試しください。" }, { status: 429, headers: rateLimitHeaders(ipLimit) });

  const body = await readJsonWithLimit(request, 1_024);
  if (!body.ok) return jsonNoStore({ message: body.message }, { status: body.status });
  const input = z.object({ email: z.email().max(254) }).safeParse(body.value);
  if (!input.success) return jsonNoStore({ message: "メールアドレスを確認してください。" }, { status: 400 });
  const email = input.data.email.normalize("NFKC").toLowerCase();

  const emailLimit = await consumeRateLimit(request, "magic-link:email", { limit: 3, windowSeconds: 3_600 }, email);
  if (!emailLimit.available) return jsonNoStore({ message: "ログイン機能は現在利用できません。" }, { status: 503 });
  if (!emailLimit.allowed) {
    // Keep the response indistinguishable from a successful request.
    return jsonNoStore({ message: "登録状況にかかわらず、利用可能な場合はログインリンクを送信しました。" }, { status: 202 });
  }

  let settings: ReturnType<typeof getSupabaseSettings>;
  try {
    settings = getSupabaseSettings("auth");
  } catch (error) {
    console.error("Magic link configuration error", error instanceof ConfigurationError ? error.variable : "unknown");
    settings = null;
  }
  if (!settings) return jsonNoStore({ message: "ログイン機能は現在準備中です。" }, { status: 503 });
  const client = createClient(settings.url, settings.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteConfig.url}/auth/callback?next=/salon`, shouldCreateUser: true },
  });
  if (error) console.error("Magic link provider rejected a request", error.code ?? "provider_error");
  return jsonNoStore({ message: "登録状況にかかわらず、利用可能な場合はログインリンクを送信しました。" }, { status: 202 });
}
