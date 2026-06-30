import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readBodyWithLimit, readJsonWithLimit, requestIdempotencyKey, safeInternalPath, validateBrowserMutation } from "@/lib/security";

afterEach(() => vi.unstubAllEnvs());

describe("browser mutation protection", () => {
  it("accepts an exact configured same-origin request", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bees.example");
    const request = new NextRequest("https://bees.example/api/contact", {
      method: "POST",
      headers: { origin: "https://bees.example", "sec-fetch-site": "same-origin" },
    });
    expect(validateBrowserMutation(request)).toEqual({ ok: true });
  });

  it("rejects a cross-site request even when it supplies an allowed Origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bees.example");
    const request = new NextRequest("https://bees.example/api/contact", {
      method: "POST",
      headers: { origin: "https://bees.example", "sec-fetch-site": "cross-site" },
    });
    expect(validateBrowserMutation(request)).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects a Host-derived origin that is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bees.example");
    const request = new NextRequest("https://attacker.example/api/contact", {
      method: "POST",
      headers: { origin: "https://attacker.example", "sec-fetch-site": "same-origin" },
    });
    expect(validateBrowserMutation(request)).toMatchObject({ ok: false, status: 403 });
  });
});

describe("bounded request bodies", () => {
  it("rejects a declared oversized body before parsing", async () => {
    const request = new Request("https://bees.example/api", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "999" },
      body: "{}",
    });
    expect(await readBodyWithLimit(request, 16, ["application/json"])).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects a streamed body that exceeds the limit", async () => {
    const request = new Request("https://bees.example/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(100) }),
    });
    expect(await readJsonWithLimit(request, 16)).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects a misleading content type", async () => {
    const request = new Request("https://bees.example/api", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    expect(await readJsonWithLimit(request, 16)).toMatchObject({ ok: false, status: 415 });
  });
});

describe("redirect and idempotency validation", () => {
  it("uses an allow-list instead of accepting arbitrary relative paths", () => {
    expect(safeInternalPath("/salon/gallery", ["/salon", "/salon/gallery"], "/salon")).toBe("/salon/gallery");
    expect(safeInternalPath("//attacker.example", ["/salon"], "/salon")).toBe("/salon");
    expect(safeInternalPath("/\\attacker.example", ["/salon"], "/salon")).toBe("/salon");
  });

  it("accepts only a version-4 UUID idempotency key", () => {
    const valid = new NextRequest("https://bees.example/api", { headers: { "x-idempotency-key": "01234567-89ab-4def-8abc-0123456789ab" } });
    const invalid = new NextRequest("https://bees.example/api", { headers: { "x-idempotency-key": "predictable" } });
    expect(requestIdempotencyKey(valid)).toBe("01234567-89ab-4def-8abc-0123456789ab");
    expect(requestIdempotencyKey(invalid)).toBeNull();
  });
});
