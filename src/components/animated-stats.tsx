"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 2023, suffix: "年", label: "活動スタート" },
  { value: 4, suffix: "基", label: "見守る巣箱" },
  { value: 80000, suffix: "+", label: "推定ミツバチ" },
  { value: 24, suffix: "時間", label: "センサー観測" },
];

export function AnimatedStats() {
  const root = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && setStarted(true), { threshold: .35 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className="grid overflow-hidden rounded-[2rem] border border-bark/10 bg-bark text-cream shadow-paper sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat) => <Stat key={stat.label} {...stat} started={started} />)}</div>;
}

function Stat({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 1300); setShown(Math.round(value * (1 - Math.pow(1 - progress, 3)))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value]);
  return <div className="border-b border-r border-cream/15 p-7 text-center last:border-r-0 sm:p-8"><p className="text-3xl font-black text-pollen sm:text-4xl">{shown.toLocaleString("ja-JP")}<span className="ml-1 text-base">{suffix}</span></p><p className="mt-2 text-sm text-cream/75">{label}</p></div>;
}
