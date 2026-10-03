"use client";

import { useState } from "react";
import { barHeights } from "@/lib/report";

type Point = { label: string; value: number; text: string };

export function TrendChart({ title, points, total, maxText }: { title: string; points: Point[]; total: string; maxText: string }) {
  const heights = barHeights(points.map((p) => p.value));
  const [picked, setPicked] = useState<number>();
  const shown = picked === undefined ? undefined : points[picked];

  return (
    <section className="rounded-[10px] border bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{total}</span>
      </div>
      <p className="mb-2 h-5 text-sm tabular-nums" aria-live="polite">
        {shown ? <><b className="font-semibold">{shown.label}</b> · {shown.text}</> : <span className="text-muted-foreground">Ketuk batang untuk melihat nilai.</span>}
      </p>
      <div className="flex gap-2">
        <div className="flex h-40 flex-col justify-between text-right text-[12px] leading-none text-muted-foreground tabular-nums" aria-hidden>
          <span>{maxText}</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            <div className="border-t border-dashed" />
            <div className="border-t border-dashed" />
            <div className="border-t" />
          </div>
          <div role="group" aria-label={`${title}: ${points.map((p) => `${p.label} ${p.text}`).join(", ")}`} className="relative flex h-40 items-end gap-[3px]">
            {points.map((p, i) => (
              <button
                key={p.label}
                type="button"
                title={`${p.label}: ${p.text}`}
                aria-label={`${p.label}: ${p.text}`}
                onClick={() => setPicked(i)}
                className="flex h-full min-w-0 flex-1 items-end outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  className={`w-full rounded-t-sm ${i === picked ? "bg-info" : p.value > 0 ? "bg-primary" : "bg-muted"}`}
                  style={{ height: `${Math.max(heights[i] * 100, p.value > 0 ? 2 : 1)}%` }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-[calc(2.5rem+0.5rem)] text-[12.5px] text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </section>
  );
}
