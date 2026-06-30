import type { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateIoTRequest, validateReadingTime } from "@/lib/iot-auth";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { emptyNoStore, jsonNoStore, readBodyWithLimit } from "@/lib/security";
import { createServiceClient } from "@/lib/supabase/server";

const readingSchema = z.object({
  hiveId: z.uuid(),
  recordedAt: z.iso.datetime({ offset: true }),
  temperature: z.number().finite().min(-20).max(70),
  humidity: z.number().finite().min(0).max(100),
  weight: z.number().finite().min(0).max(500),
  activity: z.number().finite().min(0).max(100),
}).strict();

export async function POST(request: NextRequest) {
  const ipLimit = await consumeRateLimit(request, "iot-ingest:ip", { limit: 300, windowSeconds: 60 });
  if (!ipLimit.available) return emptyNoStore(503);
  if (!ipLimit.allowed) return emptyNoStore(429, rateLimitHeaders(ipLimit));

  const body = await readBodyWithLimit(request, 8 * 1_024, ["application/json"]);
  if (!body.ok) return jsonNoStore({ message: body.message }, { status: body.status });
  const authentication = authenticateIoTRequest(request, body.raw);
  if (!authentication.ok) return emptyNoStore(authentication.kind === "configuration" ? 503 : 401);

  const keyLimit = await consumeRateLimit(
    request,
    "iot-ingest:key",
    { limit: 240, windowSeconds: 60 },
    authentication.identity.keyId,
  );
  if (!keyLimit.available) return emptyNoStore(503);
  if (!keyLimit.allowed) return emptyNoStore(429, rateLimitHeaders(keyLimit));

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(body.raw);
  } catch {
    return jsonNoStore({ message: "Invalid reading" }, { status: 400 });
  }
  const parsed = readingSchema.safeParse(parsedJson);
  if (!parsed.success || parsed.data.hiveId !== authentication.identity.hiveId || !validateReadingTime(parsed.data.recordedAt)) {
    return jsonNoStore({ message: "Invalid reading" }, { status: 400 });
  }

  const database = createServiceClient();
  if (!database) return emptyNoStore(503);
  const { error } = await database.from("sensor_readings").insert({
    ingestion_id: authentication.identity.ingestionId,
    hive_id: parsed.data.hiveId,
    recorded_at: parsed.data.recordedAt,
    temperature: parsed.data.temperature,
    humidity: parsed.data.humidity,
    weight: parsed.data.weight,
    activity: parsed.data.activity,
  });

  if (error?.code === "23505") {
    const { data: existing, error: lookupError } = await database
      .from("sensor_readings")
      .select("id")
      .eq("ingestion_id", authentication.identity.ingestionId)
      .maybeSingle();
    if (!lookupError && existing) return emptyNoStore(204);
    return emptyNoStore(409);
  }
  if (error) {
    console.error("IoT insert failed", error.code);
    return emptyNoStore(500);
  }
  return emptyNoStore(204);
}
