import Link from "next/link";

export default function NotFound() {
  return <div className="page-shell grid min-h-[60vh] place-items-center py-20 text-center"><div><div className="text-7xl" aria-hidden="true">🐝</div><h1 className="mt-6 text-4xl font-black">この花は見つかりませんでした</h1><p className="mt-4 text-bark/70">ページが移動したか、まだ公開されていないようです。</p><Link className="button-primary mt-8" href="/">ホームへ戻る</Link></div></div>;
}
