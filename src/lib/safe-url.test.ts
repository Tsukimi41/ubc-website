import { describe, expect, it } from "vitest";
import { parseHostAllowList, safeExternalUrl } from "@/lib/safe-url";

describe("external URL allow-list", () => {
  it("allows exact HTTPS hosts and strips URL ambiguity through canonicalization", () => {
    expect(safeExternalUrl("https://news.example/post?id=1", ["news.example"])).toBe("https://news.example/post?id=1");
  });

  it("rejects credentials, HTTP, lookalike domains, and script URLs", () => {
    const allowed = ["news.example"];
    expect(safeExternalUrl("https://user:pass@news.example/", allowed)).toBeUndefined();
    expect(safeExternalUrl("http://news.example/", allowed)).toBeUndefined();
    expect(safeExternalUrl("https://news.example.attacker.test/", allowed)).toBeUndefined();
    expect(safeExternalUrl("javascript:alert(1)", allowed)).toBeUndefined();
  });

  it("supports explicit wildcard subdomains without allowing the parent host", () => {
    expect(safeExternalUrl("https://media.cdn.example/a.jpg", ["*.cdn.example"])).toBe("https://media.cdn.example/a.jpg");
    expect(safeExternalUrl("https://cdn.example/a.jpg", ["*.cdn.example"])).toBeUndefined();
  });

  it("drops malformed allow-list entries", () => {
    expect(parseHostAllowList("good.example, https://bad.example,*.cdn.example")).toEqual(["good.example", "*.cdn.example"]);
  });
});
