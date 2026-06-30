import "server-only";
import type { DashboardData, DiaryEntry, Product, Update } from "@/lib/types";

export const fallbackUpdates: Update[] = [
  { id: "welcome", title: "Urban Bee Clubへようこそ", body: "屋上のミツバチと、毎日ていねいに向き合っています。速報はTumblr連携後にここへ届きます。", date: "2025-05-18", tags: ["news"] },
  { id: "inspection", title: "春の内検を行いました", body: "女王蜂の様子と貯蜜量を確認。働き蜂たちは今日も元気です。", date: "2025-04-27", tags: ["news"] },
  { id: "sensors", title: "巣箱センサーを調整中", body: "温度・湿度・重さ・活動量を、ミツバチに負担をかけず測る方法を研究しています。", date: "2025-04-08", tags: ["news", "research"] },
];

export const fallbackDiary: DiaryEntry[] = [
  { id: "sound", title: "羽音から群れの変化を読む", excerpt: "巣箱の音には、群れの状態を知る手がかりがあります。AIによる解析と分蜂予測の取り組みを紹介します。", publishedAt: "2025-05-10", category: "研究" },
  { id: "care", title: "屋上で続く、毎日の世話", excerpt: "暑い日も寒い日も。ミツバチを愛する教授と学生が見守る、都市養蜂の日常です。", publishedAt: "2025-04-16", category: "養蜂日誌" },
  { id: "iot", title: "スマート巣箱のしくみ", excerpt: "小さなセンサーが集めたデータを、ミツバチの健康と研究にどう役立てるのかをまとめました。", publishedAt: "2025-03-28", category: "技術" },
];

const now = Date.now();
export const demoDashboardData: DashboardData = {
  hiveName: "調布キャンパス 屋上巣箱 A",
  status: "demo",
  lastUpdated: new Date(now).toISOString(),
  readings: Array.from({ length: 24 }, (_, index) => {
    const hour = index - 23;
    const daylight = Math.max(0, Math.sin(((index - 5) / 23) * Math.PI));
    return {
      recordedAt: new Date(now + hour * 60 * 60 * 1000).toISOString(),
      temperature: Number((31.2 + daylight * 4.1 + Math.sin(index) * 0.3).toFixed(1)),
      humidity: Number((62 - daylight * 8 + Math.cos(index * 0.7) * 1.5).toFixed(1)),
      weight: Number((38.4 + index * 0.025 + Math.sin(index * 0.3) * 0.08).toFixed(2)),
      activity: Math.round(12 + daylight * 76 + Math.sin(index * 0.8) * 4),
    };
  }),
};

export const products: Product[] = [
  { id: "campus-honey", name: "キャンパス採れ はちみつ", description: "季節ごとに香りが変わる、調布キャンパスの百花蜜。", price: 1200, emoji: "🍯", stock: 20, stripePriceId: process.env.STRIPE_HONEY_PRICE_ID },
  { id: "beeswax-cream", name: "みつろうクリーム", description: "みつろうを生かした、しっとりやさしい保湿クリーム。", price: 800, emoji: "🌼", stock: 12, stripePriceId: process.env.STRIPE_CREAM_PRICE_ID },
  { id: "lip-balm", name: "みつろうリップ", description: "持ち歩きやすい、自然素材のリップクリーム。", price: 600, emoji: "🐝", stock: 16, stripePriceId: process.env.STRIPE_LIP_PRICE_ID },
];
