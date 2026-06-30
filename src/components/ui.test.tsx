import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHero, StatusPill } from "@/components/ui";

describe("shared UI", () => {
  it("uses a single page heading", () => { render(<PageHero eyebrow="Test" title="ページ名" description="説明"/>); expect(screen.getByRole("heading", { level: 1, name: "ページ名" })).toBeInTheDocument(); });
  it("announces fallback sensor data", () => { render(<StatusPill status="cached"/>); expect(screen.getByText("最終取得データ")).toBeInTheDocument(); });
});
