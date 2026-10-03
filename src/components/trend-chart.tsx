import { barHeights } from "@/lib/report";

type Point = { label: string; value: number; text: string };

export function TrendChart({ title, points, total }: { title: string; points: Point[]; total: string }) {
  const heights = barHeights(points.map((p) => p.value));
  return (
    <section className="rounded-[10px] border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{total}</span>
      </div>
      <div role="img" aria-label={`${title}: ${points.map((p) => `${p.label} ${p.text}`).join(", ")}`} className="flex h-40 items-end gap-[3px]">
        {points.map((p, i) => (
          <div key={p.label} title={`${p.label}: ${p.text}`} className="flex h-full min-w-0 flex-1 items-end">
            <div className={p.value > 0 ? "w-full rounded-t-sm bg-primary" : "w-full rounded-t-sm bg-muted"} style={{ height: `${Math.max(heights[i] * 100, p.value > 0 ? 2 : 1)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12.5px] text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </section>
  );
}
