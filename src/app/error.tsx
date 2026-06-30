"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-shell grid min-h-[60vh] place-items-center py-20 text-center"><div><div className="text-7xl" aria-hidden="true">🌿</div><h1 className="mt-6 text-4xl font-black">少し羽を休めています</h1><p className="mt-4 text-bark/70">読み込みに失敗しました。時間をおいて、もう一度お試しください。</p><button className="button-primary mt-8" onClick={reset}>もう一度読み込む</button></div></div>;
}
