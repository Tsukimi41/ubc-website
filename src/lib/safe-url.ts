const HOST_PATTERN = /^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

export function parseHostAllowList(value: string | undefined): string[] {
  return [...new Set((value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase().replace(/\.$/u, ""))
    .filter((host) => HOST_PATTERN.test(host)))];
}

function hostAllowed(hostname: string, allowList: readonly string[]) {
  const normalized = hostname.toLowerCase().replace(/\.$/u, "");
  return allowList.some((rule) => {
    if (!rule.startsWith("*.")) return normalized === rule;
    const suffix = rule.slice(1);
    return normalized.endsWith(suffix) && normalized.length > suffix.length;
  });
}

/** Returns a canonical HTTPS URL only when its hostname is explicitly allowed. */
export function safeExternalUrl(value: unknown, allowList: readonly string[]): string | undefined {
  if (typeof value !== "string" || value.length > 2_048 || allowList.length === 0) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !hostAllowed(url.hostname, allowList)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
