import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticateIoTRequest } from "@/lib/iot-auth";

const hiveId = "00000000-0000-4000-8000-000000000001";
const ingestionId = "00000000-0000-4000-8000-000000000002";
const secret = "a-secure-device-secret-with-more-than-32-bytes";
const body = JSON.stringify({ hiveId, recordedAt: "2026-06-30T12:00:00Z", temperature: 34, humidity: 60, weight: 40, activity: 50 });

afterEach(() => vi.unstubAllEnvs());

function signedRequest(timestamp: number, requestBody = body, signatureSecret = secret) {
  const signed = `${timestamp}\n${ingestionId}\n${requestBody}`;
  const signature = createHmac("sha256", signatureSecret).update(signed).digest("hex");
  return new Request("https://bees.example/api/iot/readings", {
    method: "POST",
    headers: {
      "x-ubc-key-id": "sensor-a",
      "x-ubc-timestamp": String(timestamp),
      "x-ubc-idempotency-key": ingestionId,
      "x-ubc-signature": `v1=${signature}`,
    },
    body: requestBody,
  });
}

function configure() {
  vi.stubEnv("IOT_INGEST_KEYS", JSON.stringify({ "sensor-a": { hiveId, secret } }));
  vi.stubEnv("IOT_SIGNATURE_TOLERANCE_SECONDS", "300");
}

describe("IoT HMAC authentication", () => {
  it("accepts a correctly signed, fresh request and binds it to one hive", () => {
    configure();
    const timestamp = Math.floor(Date.now() / 1_000);
    expect(authenticateIoTRequest(signedRequest(timestamp), body)).toEqual({
      ok: true,
      identity: { keyId: "sensor-a", hiveId, ingestionId },
    });
  });

  it("rejects body tampering", () => {
    configure();
    const timestamp = Math.floor(Date.now() / 1_000);
    const request = signedRequest(timestamp, body, "different-secret-that-is-also-long-enough");
    expect(authenticateIoTRequest(request, body)).toEqual({ ok: false, kind: "authentication" });
  });

  it("rejects an expired signature", () => {
    configure();
    const timestamp = Math.floor(Date.now() / 1_000) - 301;
    expect(authenticateIoTRequest(signedRequest(timestamp), body)).toEqual({ ok: false, kind: "authentication" });
  });
});
