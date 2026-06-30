import { describe, expect, it } from "vitest";
import { formatCurrency, sanitizePlainText } from "@/lib/format";

describe("format helpers", () => {
  it("formats Japanese yen without decimals", () => expect(formatCurrency(1200)).toContain("1,200"));
  it("removes angle brackets from untrusted notification text", () => expect(sanitizePlainText(" <script>alert(1)</script> ")).toBe("scriptalert(1)/script"));
});
