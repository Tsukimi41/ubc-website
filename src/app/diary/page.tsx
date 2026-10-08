import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { DiaryCard } from "@/components/diary-card";
import { getDiaryEntries } from "@/lib/cms";

export const metadata: Metadata = { title: "養蜂日誌", description: "日々の養蜂の様子と、Urban Bee Clubの研究記録を写真とともにお届けします。" };

export default async function DiaryPage() {
  const entries = await getDiaryEntries();
  return <>
    <PageHero eyebrow="Bee diary" title="巣箱をひらいた日の記録。" description="季節、群れの変化、技術の試行錯誤。長い時間をかけて見えてきたことを、記録として残します。" />
    <div className="page-shell py-16">
      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => <DiaryCard key={entry.id} entry={entry} />)}
      </div>
    </div>
  </>;
}
