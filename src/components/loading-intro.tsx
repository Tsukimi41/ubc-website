"use client";

import { useEffect, useRef, useState } from "react";

export function LoadingIntro() {
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("ubc-intro-seen")) return;
    setVisible(true);
    sessionStorage.setItem("ubc-intro-seen", "true");
    let cleanup = () => {};
    void import("animejs").then(({ animate, stagger, svg }) => {
      if (!root.current) return;
      const paths = root.current.querySelectorAll(".draw-line");
      animate(svg.createDrawable(paths), { draw: ["0 0", "0 1"], duration: 900, delay: stagger(100), ease: "inOutQuad" });
      animate(root.current.querySelectorAll(".fill-cell"), { opacity: [0, 1], scale: [.7, 1], delay: stagger(100, { start: 500 }), duration: 650, ease: "outElastic(1, .6)" });
      const vine = document.querySelectorAll(".vine-path path");
      if (vine.length) animate(svg.createDrawable(vine), { draw: ["0 0", "0 1"], delay: 700, duration: 950, ease: "inOutQuad" });
      animate(document.querySelectorAll(".vine-leaf ellipse"), { opacity: [0, 1], scale: [0, 1], delay: stagger(90, { start: 1050 }), duration: 600, ease: "outElastic(1, .55)" });
      animate(document.querySelectorAll("[data-nav-item], [data-hero-copy] > *"), { opacity: [0, 1], y: [16, 0], delay: stagger(60, { start: 1150 }), duration: 600, ease: "outCubic" });
      const timeout = window.setTimeout(() => setVisible(false), 1900);
      cleanup = () => window.clearTimeout(timeout);
    });
    return () => cleanup();
  }, []);
  if (!visible) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] grid place-items-center bg-cream" role="status" aria-label="サイトを読み込んでいます">
      <div className="text-center"><svg className="mx-auto h-32 w-32 text-bark" viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"><path className="draw-line" d="m35 10 25 14v29L35 67 10 53V24Z"/><path className="draw-line" d="m85 10 25 14v29L85 67 60 53V24Z"/><path className="draw-line" d="m60 53 25 14v29l-25 14-25-14V67Z"/></g><g fill="#FFD85A"><circle className="fill-cell" cx="35" cy="39" r="9"/><circle className="fill-cell" cx="85" cy="39" r="9"/><circle className="fill-cell" cx="60" cy="81" r="9"/></g></svg><p className="mt-4 font-bold tracking-widest">ハチたちの世界へ</p></div>
    </div>
  );
}
