import type { DiaryEntry } from "@/lib/types";

export const september24Diary = {
  id: "2026-09-24-apiary",
  title: "9月24日の養蜂場 — 巣箱まわりの作業風景",
  excerpt: "青空の下、巣箱が並ぶ養蜂場でのひとこま。ネットを扱う作業や、巣枠を手に巣箱に向き合う様子を、4枚の写真でお届けします。",
  publishedAt: "2026-09-24",
  category: "養蜂日誌",
  imageUrl: "/images/diary/2026-09-24/photo-4.jpg",
  url: "/diary/2026-09-24-apiary",
  paragraphs: [
    "9月24日、青空の広がる養蜂場の様子をお届けします。建物に囲まれた一角には巣箱が並び、防護服を着て作業にあたる姿がありました。",
    "この日の写真には、大きな黒いネットを扱う場面や、巣枠を手に巣箱に向き合う場面が収められています。巣箱を少し離れた場所から眺めた景色と、そばで見る作業風景を記録しました。",
    "緑のネットに囲まれた養蜂場の全景も一枚に。巣箱まわりの日常を、写真とともに残します。",
  ],
  photos: [
    { src: "/images/diary/2026-09-24/photo-1.jpg", alt: "巣箱が並ぶ養蜂場で、防護服を着た人が大きな黒いネットを扱う様子", caption: "巣箱の前で、黒いネットを扱う作業中のひとこま。" },
    { src: "/images/diary/2026-09-24/photo-2.jpg", alt: "頭上にネットが張られた養蜂場と、巣箱の間で巣枠を持つ防護服姿の人", caption: "並んだ巣箱の間で、巣枠を手に作業する様子。" },
    { src: "/images/diary/2026-09-24/photo-3.jpg", alt: "ベルトで固定された巣箱と、奥で巣箱に向き合う防護服姿の人", caption: "巣箱のそばから見た作業風景。" },
    { src: "/images/diary/2026-09-24/photo-4.jpg", alt: "青空の下、緑のネットに囲まれた養蜂場に巣箱が並ぶ全景", caption: "緑のネットに囲まれた、9月24日の養蜂場。" },
  ],
} satisfies DiaryEntry & {
  paragraphs: string[];
  photos: { src: string; alt: string; caption: string }[];
};

export const localDiaryEntries: DiaryEntry[] = [september24Diary];
