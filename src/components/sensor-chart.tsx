"use client";

import type { SensorReading } from "@/lib/types";

const config = {
  temperature: { label: "温度", unit: "°C", color: "#D35F12" }, humidity: { label: "湿度", unit: "%", color: "#237A76" },
  weight: { label: "重量", unit: "kg", color: "#74512D" }, activity: { label: "活動量", unit: "%", color: "#6A772D" },
} as const;

export function SensorChart({ readings, metric }: { readings: SensorReading[]; metric: keyof typeof config }) {
  const values = readings.map((item) => item[metric]);
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${90 - ((value - min) / range) * 72}`).join(" ");
  const item = config[metric];
  return <figure><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-bold text-bark/60">{item.label}</p><p className="text-3xl font-black">{values.at(-1)?.toLocaleString("ja-JP")}<span className="ml-1 text-base">{item.unit}</span></p></div><p className="text-xs text-bark/55">24時間の推移</p></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-36 w-full overflow-visible" role="img" aria-label={`${item.label}の24時間推移。最低${min}${item.unit}、最高${max}${item.unit}`}><defs><linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={item.color} stopOpacity=".35"/><stop offset="1" stopColor={item.color} stopOpacity="0"/></linearGradient></defs><path d="M0 90H100M0 54H100M0 18H100" stroke="#562F00" strokeOpacity=".12" strokeWidth=".4" vectorEffect="non-scaling-stroke"/><polygon points={`0,92 ${points} 100,92`} fill={`url(#fill-${metric})`}/><polyline points={points} fill="none" stroke={item.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg></figure>;
}
