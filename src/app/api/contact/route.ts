import type { NextRequest } from "next/server";
import { z } from "zod";
import { neutralizeNotificationMentions, sanitizePlainText } from "@/lib/format";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { ConfigurationError, commaSeparatedSetting, optionalSetting, parseUrlSetting } from "@/lib/server-config";
import { jsonNoStore, readJsonWithLimit, validateBrowserMutation } from "@/lib/security";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1).max(80), email: z.email().max(254), affiliation: z.string().trim().max(120).optional().default(""),
  kind: z.enum(["join", "outreach", "research", "other"]), message: z.string().trim().min(10).max(2000), consent: z.literal("true"), website: z.string().max(0).optional().default(""),
});

export async function POST(request: NextRequest) {
  const mutation = validateBrowserMutation(request);
  if (!mutation.ok) return jsonNoStore({ message: mutation.message }, { status: mutation.status });

  const limit = await consumeRateLimit(request, "contact:ip", { limit: 5, windowSeconds: 3_600 });
  if (!limit.available) return jsonNoStore({ message: "現在送信できません。時間をおいてお試しください。" }, { status: 503 });
  if (!limit.allowed) return jsonNoStore(
    { message: "送信回数が多すぎます。しばらく待ってお試しください。" },
    { status: 429, headers: rateLimitHeaders(limit) },
  );

  const body = await readJsonWithLimit(request, 16 * 1_024);
  if (!body.ok) return jsonNoStore({ message: body.message }, { status: body.status });
  const parsed = schema.safeParse(body.value);
  if (!parsed.success) return jsonNoStore({ message: "入力内容を確認してください。" }, { status: 400 });
  const data = { ...parsed.data, name: sanitizePlainText(parsed.data.name), affiliation: sanitizePlainText(parsed.data.affiliation), message: sanitizePlainText(parsed.data.message) };
  const client = createServiceClient();
  if (!client && process.env.NODE_ENV === "production") {
    console.error("Contact storage unavailable in production");
    return jsonNoStore({ message: "現在送信できません。時間をおいてお試しください。" }, { status: 503 });
  }
  if (client) {
    const { error } = await client.from("contact_submissions").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      affiliation: data.affiliation || null,
      kind: data.kind,
      message: data.message,
    });
    if (error) {
      console.error("Contact insert failed", error.code);
      return jsonNoStore({ message: "現在送信できません。時間をおいてお試しください。" }, { status: 503 });
    }
  }

  const webhookValue = optionalSetting("CONTACT_WEBHOOK_URL");
  if (webhookValue) {
    try {
      const allowedHosts = commaSeparatedSetting("CONTACT_WEBHOOK_ALLOWED_HOSTS");
      if (!allowedHosts.length) throw new ConfigurationError("CONTACT_WEBHOOK_ALLOWED_HOSTS", "is required when CONTACT_WEBHOOK_URL is set");
      const webhook = parseUrlSetting("CONTACT_WEBHOOK_URL", webhookValue, { allowedHosts });
      const notification = neutralizeNotificationMentions(
        `Urban Bee Club 問い合わせ\n種別: ${data.kind}\n氏名: ${data.name}\nメール: ${data.email}\n所属: ${data.affiliation}\n\n${data.message}`,
      );
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notification }),
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) console.error("Contact notification returned a non-success status", response.status);
    } catch (error) {
      console.error("Contact notification failed", error instanceof ConfigurationError ? error.variable : "network_error");
    }
  }
  if (!client) console.info("Contact accepted only for local development", { kind: data.kind });
  return jsonNoStore({ message: "内容を確認のうえ、担当者からご連絡します。" }, { status: 201 });
}
