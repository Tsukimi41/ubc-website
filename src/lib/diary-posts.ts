import type { DiaryEntry } from "@/lib/types";

export const october2Diary = {
  id: "2026-10-02-net-hole",
  title: "10月2日、スズメバチの捕獲とネットに見つかった穴",
  excerpt: "午後にオオスズメバチ3匹、コガタスズメバチ3匹を捕獲。張ったばかりのネットに穴が見つかり、補修と原因について考えました。養蜂場の様子を写真6枚で記録します。",
  publishedAt: "2026-10-02",
  category: "養蜂日誌",
  imageUrl: "/images/diary/2026-10-02/photo-5.jpg",
  url: "/diary/2026-10-02-net-hole",
  photos: [
    { src: "/images/diary/2026-10-02/photo-1.jpg", width: 1280, height: 721, alt: "金網の捕獲器を付けた巣箱と、足元に残る多数のミツバチ", caption: "写真1：巣箱前の捕獲器と足元の様子。" },
    { src: "/images/diary/2026-10-02/photo-2.jpg", width: 721, height: 1280, alt: "巣箱の正面にある金網の捕獲器と、その下の地面に集まったミツバチ", caption: "写真2：正面から見た捕獲器と巣箱の足元。" },
    { src: "/images/diary/2026-10-02/photo-3.jpg", width: 1280, height: 721, alt: "緑のネットに囲まれた養蜂場で、捕獲器を付けた巣箱が並ぶ様子", caption: "写真3：巣箱と捕獲器を横から見た様子。" },
    { src: "/images/diary/2026-10-02/photo-4.jpg", width: 1280, height: 721, alt: "左右にブロックを置いた巣箱と、その前の金網の捕獲器", caption: "写真4：ブロックを置いた巣箱の正面。" },
    { src: "/images/diary/2026-10-02/photo-5.jpg", width: 1280, height: 721, alt: "緑のネットに囲まれた養蜂場に巣箱が並び、中央の巣箱に白いネットが掛かる全景", caption: "写真5：ネットに囲まれた養蜂場の全景。" },
    { src: "/images/diary/2026-10-02/photo-6.jpg", width: 1280, height: 721, alt: "中央の巣箱を覆う白いネットと、それを押さえる赤いレンガ", caption: "写真6：白いネットを掛けた巣箱。端はレンガで押さえています。" },
  ],
} satisfies DiaryEntry & {
  photos: { src: string; width: number; height: number; alt: string; caption: string }[];
};

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

export const september14Diary = {
  id: "2026-09-14-hornet-defense",
  title: "9月14日、大型スズメバチの襲撃 — ミツバチを守るために",
  excerpt: "大学の養蜂場で、多くのミツバチが犠牲になっています。大型スズメバチの脅威とミツバチの防衛行動、巣門の両脇・正面の隙間を見直す対策案を詳しく解説します。",
  publishedAt: "2026-09-14",
  category: "養蜂日誌",
  url: "/diary/2026-09-14-hornet-defense",
} satisfies DiaryEntry;

export const september16Diary = {
  id: "2026-09-16-hive-decline",
  title: "9月16日、蜂の数が激減 — 秋の採蜜が難しい状況に",
  excerpt: "ミツバチが大きく減り、秋の採蜜は困難な状況です。粘着シートでは30匹以上のスズメバチを確認。午後の対応と、巣門前の足場を見直すアイデアを写真8枚とともに記録します。",
  publishedAt: "2026-09-16",
  category: "養蜂日誌",
  imageUrl: "/images/diary/2026-09-16/photo-5.jpg",
  url: "/diary/2026-09-16-hive-decline",
  photos: [
    { src: "/images/diary/2026-09-16/photo-1.jpg", width: 960, height: 1280, alt: "巣門前の金網の捕獲器に入ったスズメバチと、下の台に重なるミツバチの死骸", caption: "写真1：捕獲器と巣門前の様子。台の上には多くのミツバチの死骸が残っています。" },
    { src: "/images/diary/2026-09-16/photo-2.jpg", width: 960, height: 1280, alt: "上部に多数のスズメバチが入った捕獲器と、巣門前に積もるミツバチの死骸", caption: "写真2：捕獲器の上部にも多数のスズメバチ。巣門前には被害の大きさが表れています。" },
    { src: "/images/diary/2026-09-16/photo-3.jpg", width: 1280, height: 960, alt: "金網と漏斗状の入口がある捕獲器を斜めから見た様子と、手前の板や台", caption: "写真3：捕獲器を斜めから記録。手前の板や台を含め、巣門への近づき方を見直します。" },
    { src: "/images/diary/2026-09-16/photo-4.jpg", width: 960, height: 1280, alt: "巣箱を支える黒いパレットの隙間や人工芝の上に残るミツバチの死骸", caption: "写真4：巣箱の足元にも、多くのミツバチの死骸が残っていました。" },
    { src: "/images/diary/2026-09-16/photo-5.jpg", width: 3840, height: 2881, alt: "開いた巣箱の木製の巣枠と、その上や隙間に見えるミツバチ", caption: "写真5：巣箱を開けて記録した内部の様子。巣枠の上や隙間にミツバチが見えます。" },
    { src: "/images/diary/2026-09-16/photo-6.jpg", width: 3840, height: 2881, alt: "緑の縁の巣箱に並ぶ巣枠と、その間に残るミツバチ", caption: "写真6：並んだ巣枠とミツバチ。蜂の数が激減しているという、この日の現場の記録です。" },
    { src: "/images/diary/2026-09-16/photo-7.jpg", width: 3840, height: 2881, alt: "一部の巣枠が外され、奥の金網とミツバチが見える巣箱の内部", caption: "写真7：一部の巣枠を外した状態で見える巣箱の内部。" },
    { src: "/images/diary/2026-09-16/photo-8.jpg", width: 3840, height: 2881, alt: "日が当たる巣枠の上にミツバチが見え、巣箱の隣に捕獲器が置かれている様子", caption: "写真8：巣箱の内部と、横に置かれた捕獲器。9月16日の状況を記録しました。" },
  ],
} satisfies DiaryEntry & {
  photos: { src: string; width: number; height: number; alt: string; caption: string }[];
};

export const september18Diary = {
  id: "2026-09-18-hornet-traps",
  title: "9月18日、スズメバチの飛来が続く — 防水性の粘着シートを追加",
  excerpt: "午前にキイロスズメバチ5匹、午後にオオスズメバチ2匹を捕獲しました。防水性の粘着シートを追加し、巣門まわりの様子を写真に残しました。",
  publishedAt: "2026-09-18",
  category: "養蜂日誌",
  imageUrl: "/images/diary/2026-09-18/photo-1.jpg",
  url: "/diary/2026-09-18-hornet-traps",
} satisfies DiaryEntry;

export const localDiaryEntries: DiaryEntry[] = [october2Diary, september24Diary, september18Diary, september16Diary, september14Diary];
