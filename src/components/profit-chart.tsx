export type ProfitBar = { label: string; value: number; text: string };

export function ProfitChart({ title, subtitle, bars }: { title: string; subtitle?: string; bars: ProfitBar[] }) {
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));
  const hasNegative = bars.some((b) => b.value < 0);

  return (
    <section className="rounded-[10px] border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div role="img" aria-label={`${title}: ${bars.map((b) => `${b.label} ${b.text}`).join(", ")}`} className="relative mt-4 flex h-44 items-stretch gap-[3px]">
        {hasNegative && <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed" />}
        {bars.map((b) => {
          const pct = (Math.abs(b.value) / max) * (hasNegative ? 50 : 100);
          const up = b.value >= 0;
          return (
            <div key={b.label} title={`${b.label}: ${b.text}`} className="relative min-w-0 flex-1">
              {b.value !== 0 && (
                <div
                  className={`absolute inset-x-0 rounded-sm ${up ? "bg-success" : "bg-destructive"}`}
                  style={up ? { bottom: hasNegative ? "50%" : 0, height: `${Math.max(pct, 1.5)}%` } : { top: "50%", height: `${Math.max(pct, 1.5)}%` }}
                />
              )}
              {b.value === 0 && <div className="absolute inset-x-0 bg-muted" style={{ bottom: hasNegative ? "50%" : 0, height: 2 }} />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[12.5px] text-muted-foreground">
        <span>{bars[0]?.label}</span>
        <span>{bars.at(-1)?.label}</span>
      </div>
    </section>
  );
}
