import "server-only";

export class ConfigurationError extends Error {
  readonly variable: string;

  constructor(variable: string, reason: string) {
    super(`${variable}: ${reason}`);
    this.name = "ConfigurationError";
    this.variable = variable;
  }
}

export function optionalSetting(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function requiredSetting(name: string, minimumBytes = 1): string {
  const value = optionalSetting(name);
  if (!value) throw new ConfigurationError(name, "is required");
  if (Buffer.byteLength(value, "utf8") < minimumBytes) {
    throw new ConfigurationError(name, `must contain at least ${minimumBytes} bytes`);
  }
  return value;
}

export function booleanSetting(name: string, required = false): boolean | null {
  const value = optionalSetting(name)?.toLowerCase();
  if (!value) {
    if (required) throw new ConfigurationError(name, "is required and must be true or false");
    return null;
  }
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ConfigurationError(name, "must be true or false");
}

type UrlOptions = Readonly<{
  allowLocalHttp?: boolean;
  allowedHosts?: readonly string[];
  requireOriginOnly?: boolean;
}>;

function hostMatches(hostname: string, allowed: string) {
  const normalized = allowed.toLowerCase().replace(/^\*\./u, "");
  return hostname === normalized || (allowed.startsWith("*.") && hostname.endsWith(`.${normalized}`));
}

export function parseUrlSetting(name: string, value: string, options: UrlOptions = {}): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigurationError(name, "must be an absolute URL");
  }

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(options.allowLocalHttp && local && url.protocol === "http:")) {
    throw new ConfigurationError(name, "must use HTTPS");
  }
  if (url.username || url.password) throw new ConfigurationError(name, "must not contain credentials");
  if (options.requireOriginOnly && (url.pathname !== "/" || url.search || url.hash)) {
    throw new ConfigurationError(name, "must contain an origin only, without a path, query, or fragment");
  }
  if (options.allowedHosts?.length && !options.allowedHosts.some((host) => hostMatches(url.hostname, host))) {
    throw new ConfigurationError(name, "host is not in the configured allow-list");
  }
  return url;
}

export function requiredUrlSetting(name: string, options: UrlOptions = {}): URL {
  return parseUrlSetting(name, requiredSetting(name), options);
}

export function commaSeparatedSetting(name: string): string[] {
  return [...new Set((optionalSetting(name) ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean))];
}

export function getSupabaseSettings(kind: "service" | "auth") {
  const urlValue = optionalSetting("NEXT_PUBLIC_SUPABASE_URL");
  const keyName = kind === "service" ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_ANON_KEY";
  const key = optionalSetting(keyName);
  if (!urlValue && !key) return null;
  if (!urlValue || !key) throw new ConfigurationError(keyName, "Supabase URL and key must be configured together");
  const url = parseUrlSetting("NEXT_PUBLIC_SUPABASE_URL", urlValue, {
    allowLocalHttp: process.env.NODE_ENV !== "production",
    requireOriginOnly: true,
  });
  if (Buffer.byteLength(key, "utf8") < 20) throw new ConfigurationError(keyName, "appears too short");
  return { url: url.origin, key };
}
