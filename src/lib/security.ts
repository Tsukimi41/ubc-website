import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Headers for responses that contain authentication state, validation details,
 * or mutation results. Keeping this in one place prevents a new endpoint from
 * accidentally becoming cacheable or indexable.
 */
export const privateResponseHeaders = Object.freeze({
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Expires: "0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});

// Backwards-compatible name used by route handlers.
export const noStoreHeaders = privateResponseHeaders;

export function jsonNoStore(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  return NextResponse.json(body, {
    status: init.status,
    headers: { ...privateResponseHeaders, ...Object.fromEntries(new Headers(init.headers)) },
  });
}

export function emptyNoStore(status: number, headers?: HeadersInit) {
  return new NextResponse(null, {
    status,
    headers: { ...privateResponseHeaders, ...Object.fromEntries(new Headers(headers)) },
  });
}

export function redirectNoStore(url: string | URL, status: 303 | 307 = 303) {
  const response = NextResponse.redirect(url, status);
  for (const [name, value] of Object.entries(privateResponseHeaders)) response.headers.set(name, value);
  return response;
}

type BodyReadFailure = {
  ok: false;
  status: 400 | 413 | 415;
  message: string;
};

type BodyReadSuccess = {
  ok: true;
  raw: string;
};

export type BodyReadResult = BodyReadFailure | BodyReadSuccess;

/**
 * Reads a request body with a hard byte ceiling. Content-Length alone is not a
 * sufficient defence because a chunked request can omit it or lie about it.
 */
export async function readBodyWithLimit(
  request: Pick<Request, "headers" | "body"> | Pick<Response, "headers" | "body">,
  maximumBytes: number,
  acceptedMediaTypes?: readonly string[],
): Promise<BodyReadResult> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new TypeError("maximumBytes must be a positive safe integer");
  }

  if (acceptedMediaTypes?.length) {
    const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (!mediaType || !acceptedMediaTypes.includes(mediaType)) {
      return { ok: false, status: 415, message: "対応していないContent-Typeです。" };
    }
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return { ok: false, status: 400, message: "Content-Lengthが不正です。" };
    }
    if (parsedLength > maximumBytes) {
      return { ok: false, status: 413, message: "リクエストが大きすぎます。" };
    }
  }

  if (!request.body) return { ok: true, raw: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const chunks: string[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel("body size limit exceeded");
        return { ok: false, status: 413, message: "リクエストが大きすぎます。" };
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return { ok: true, raw: chunks.join("") };
  } catch {
    return { ok: false, status: 400, message: "リクエスト本文を読み取れませんでした。" };
  } finally {
    reader.releaseLock();
  }
}

export type JsonReadResult = BodyReadFailure | { ok: true; value: unknown; raw: string };

export async function readJsonWithLimit(
  request: Request,
  maximumBytes: number,
): Promise<JsonReadResult> {
  const body = await readBodyWithLimit(request, maximumBytes, ["application/json"]);
  if (!body.ok) return body;
  try {
    return { ok: true, value: JSON.parse(body.raw), raw: body.raw };
  } catch {
    return { ok: false, status: 400, message: "JSONの形式が不正です。" };
  }
}

function parseConfiguredOrigins(): URL[] | null {
  const configured = [
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(",") ?? []),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  const origins: URL[] = [];
  for (const value of configured) {
    try {
      const url = new URL(value);
      const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && localHttp)) return null;
      if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
      origins.push(url);
    } catch {
      return null;
    }
  }
  return origins;
}

export type MutationValidation =
  | { ok: true }
  | { ok: false; status: 403 | 503; message: string };

/**
 * Browser mutation guard. It combines Fetch Metadata and an exact Origin
 * allow-list. Host/X-Forwarded-Host are deliberately not trusted, avoiding
 * Host-header poisoning of the comparison target.
 */
export function validateBrowserMutation(request: NextRequest): MutationValidation {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return { ok: false, status: 403, message: "不正な送信元です。" };
  }

  const configuredOrigins = parseConfiguredOrigins();
  if (!configuredOrigins) {
    console.error("Security configuration error: ALLOWED_ORIGINS contains an invalid origin");
    return { ok: false, status: 503, message: "セキュリティ設定を確認しています。" };
  }

  // Local development remains usable without weakening production defaults.
  if (process.env.NODE_ENV !== "production") {
    try {
      const requestUrl = new URL(request.url);
      if (["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname)) {
        configuredOrigins.push(new URL(requestUrl.origin));
      }
    } catch {
      // The Origin check below will reject malformed request URLs.
    }
  }

  if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
    console.error("Security configuration error: NEXT_PUBLIC_SITE_URL or ALLOWED_ORIGINS is required");
    return { ok: false, status: 503, message: "セキュリティ設定を確認しています。" };
  }

  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin || suppliedOrigin === "null") {
    return { ok: false, status: 403, message: "不正な送信元です。" };
  }

  try {
    const origin = new URL(suppliedOrigin);
    if (!configuredOrigins.some((allowed) => allowed.origin === origin.origin)) {
      return { ok: false, status: 403, message: "不正な送信元です。" };
    }
  } catch {
    return { ok: false, status: 403, message: "不正な送信元です。" };
  }

  return { ok: true };
}

// Compatibility wrapper for older call sites while routes are migrated.
export function hasValidOrigin(request: NextRequest) {
  return validateBrowserMutation(request).ok;
}

const IP_HEADER_NAMES = new Set([
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
]);

function firstValidIp(value: string | null): string | null {
  if (!value) return null;
  for (const candidate of value.split(",")) {
    const normalized = candidate.trim().replace(/^\[|\]$/g, "");
    if (isIP(normalized)) return normalized;
  }
  return null;
}

/**
 * Only reads proxy headers when the deployment explicitly identifies a trusted
 * proxy. Trusting an arbitrary X-Forwarded-For lets clients evade rate limits.
 */
export function requestIp(request: NextRequest): string {
  const configuredHeader = process.env.TRUSTED_PROXY_IP_HEADER?.trim().toLowerCase();
  const headerName = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : configuredHeader;
  if (headerName && IP_HEADER_NAMES.has(headerName)) {
    return firstValidIp(request.headers.get(headerName)) ?? "unavailable";
  }
  return process.env.NODE_ENV === "production" ? "unavailable" : "local-development";
}

export function opaqueIdentifier(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function safeInternalPath(value: string | null, allowedPaths: readonly string[], fallback: string) {
  if (!value || value.includes("\\") || /[\u0000-\u001F\u007F]/u.test(value)) return fallback;
  return allowedPaths.includes(value) ? value : fallback;
}

export function requestIdempotencyKey(request: NextRequest): string | null {
  const value = request.headers.get("x-idempotency-key")?.trim().toLowerCase();
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)
    ? value
    : null;
}
