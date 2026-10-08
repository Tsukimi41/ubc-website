import { afterEach, expect, it, vi } from "vitest";
import type { DiaryEntry } from "@/lib/types";

const { bundledEntries } = vi.hoisted(() => ({ bundledEntries: [] as DiaryEntry[] }));

vi.mock("@/lib/diary-posts", () => ({ localDiaryEntries: bundledEntries }));
vi.mock("next/cache", () => ({
  unstable_cache: (callback: () => Promise<unknown>) => {
    let cached: Promise<unknown> | undefined;
    return () => cached ??= callback();
  },
}));

import { getDiaryEntries } from "@/lib/cms";

afterEach(() => {
  bundledEntries.length = 0;
  vi.unstubAllEnvs();
});

it("shows newly bundled articles even while the external CMS result remains cached", async () => {
  vi.stubEnv("NOTION_TOKEN", "");
  vi.stubEnv("NOTION_DATABASE_ID", "");
  const cachedEntries = await getDiaryEntries();
  bundledEntries.push({
    id: "newly-published",
    title: "New diary",
    excerpt: "A newly published field note",
    category: "養蜂日誌",
    publishedAt: "2026-09-16",
    url: "/diary/newly-published",
  });

  const updatedEntries = await getDiaryEntries();
  expect(updatedEntries[0]?.id).toBe("newly-published");
  expect(updatedEntries.slice(1)).toEqual(cachedEntries);
});
