import { shortUgx } from "@/lib/store";

export type Series = { key: string; label: string; color: string };
export type ChartRow = { label: string; values: Record<string, number> };

/** Lightweight grouped bar chart — no chart library, brand tokens only. */
export function GroupedBars({
  rows,
  series,
  height = 180,
}: {
  rows: ChartRow[];
  series: Series[];
  height?: number;
}) {
  const max = Math.max(
    1,
    ...rows.flatMap((r) => series.map((s) => Math.abs(r.values[s.key] ?? 0))),
  );

  return (
    <div className="space-y-sm">
      <div className="flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max items-end gap-4 border-b border-outline-variant/60 pb-1" style={{ height }}>
          {rows.map((r) => (
            <div key={r.label} className="flex h-full flex-col justify-end">
              <div className="flex h-full items-end gap-1">
                {series.map((s) => {
                  const v = r.values[s.key] ?? 0;
                  const h = Math.max(2, (Math.abs(v) / max) * (height - 24));
                  return (
                    <div key={s.key} className="flex w-7 flex-col items-center justify-end gap-1">
                      <span className="text-[9px] font-bold text-on-surface-variant">{shortUgx(v)}</span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{ height: h, background: s.color, opacity: v < 0 ? 0.45 : 1 }}
                        title={`${r.label} · ${s.label}: ${v}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex min-w-max gap-4 pt-1">
          {rows.map((r) => (
            <div
              key={r.label}
              className="text-center text-[10px] font-semibold leading-tight text-on-surface-variant"
              style={{ width: series.length * 32 }}
            >
              {r.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Simple profit trend line across terms. */
export function TrendLine({ points, height = 120 }: { points: { label: string; value: number }[]; height?: number }) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(0, ...points.map((p) => p.value));
  const span = Math.max(1, max - min);
  const w = 100;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = height - ((p.value - min) / span) * (height - 16) - 8;
    return `${x},${y}`;
  });

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-28 w-full">
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => {
          const [x, y] = c.split(",");
          return <circle key={i} cx={x} cy={y} r="1.6" fill="var(--color-secondary)" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] font-semibold text-on-surface-variant">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
