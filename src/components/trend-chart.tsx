"use client";

import { useId, useState } from "react";

type Point = { label: string; value: number; text: string };

const W = 1000;
const H = 220;
const PAD = { l: 8, r: 8, t: 14, b: 8 };

export function TrendChart({ title, points, total, maxText }: { title: string; points: Point[]; total: string; maxText: string }) {
  const gradient = useId();
  const [picked, setPicked] = useState<number>();
  const max = Math.max(0, ...points.map((p) => p.value));
  const step = points.length > 1 ? (W - PAD.l - PAD.r) / (points.length - 1) : 0;
  const xy = points.map((p, i) => [points.length > 1 ? PAD.l + i * step : W / 2, max === 0 ? H - PAD.b : PAD.t + (1 - p.value / max) * (H - PAD.t - PAD.b)] as const);
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = xy.length ? `${line} L${xy.at(-1)![0].toFixed(1)},${H - PAD.b} L${xy[0][0].toFixed(1)},${H - PAD.b} Z` : "";
  const shown = picked === undefined ? points.at(-1) : points[picked];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm tabular-nums" aria-live="polite">
        <span className="text-muted-foreground">Maks. {maxText}</span>
        {shown && <span className="text-muted-foreground">{shown.label}: <b className="font-bold text-foreground">{shown.text}</b></span>}
      </div>
      <div className="relative" role="img" aria-label={`${title}, total ${total}: ${points.map((p) => `${p.label} ${p.text}`).join(", ")}`}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-52 w-full">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} stroke="var(--border)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />)}
          <line x1="0" x2={W} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          {area && <path d={area} fill={`url(#${gradient})`} />}
          {line && <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          {picked !== undefined && xy[picked] && <line x1={xy[picked][0]} x2={xy[picked][0]} y1={PAD.t} y2={H - PAD.b} stroke="var(--primary)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />}
        </svg>
        {picked !== undefined && xy[picked] && <span className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary bg-card" style={{ left: `${(xy[picked][0] / W) * 100}%`, top: `${(xy[picked][1] / H) * 100}%` }} />}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <button key={p.label} type="button" aria-label={`${p.label}: ${p.text}`} onMouseEnter={() => setPicked(i)} onFocus={() => setPicked(i)} onClick={() => setPicked(i)} className="h-full min-w-0 flex-1 outline-none" />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[12.5px] text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  );
}
