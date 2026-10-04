"use client";

import { formatPrice, formatShortDate, type DashboardSummary } from "@coffee/shared";
import { useState } from "react";

import { cn } from "@/components/ui";

type Day = DashboardSummary["daily"][number];

/** Rounds up to 1, 2, 2.5 or 5 × 10^n so the axis shows clean numbers. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return String(value);
}

const PLOT_HEIGHT = 160;

export function RevenueChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = niceCeil(Math.max(...days.map((d) => d.revenue), 0));
  const ticks = [max, max / 2, 0];
  const lastIndex = days.length - 1;

  return (
    <figure>
      <div className="mb-4 flex items-start justify-between gap-4">
        <figcaption>
          <h2 className="text-base font-semibold">Сүүлийн 7 хоногийн орлого</h2>
          <p className="text-sm text-ink-muted">Цуцалсан захиалгыг тооцоогүй</p>
        </figcaption>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="shrink-0 text-sm font-medium text-brand hover:underline">
          {showTable ? "График" : "Хүснэгт"}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="py-2 font-medium">Өдөр</th>
              <th className="py-2 text-right font-medium">Захиалга</th>
              <th className="py-2 text-right font-medium">Орлого</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day} className="border-b border-line last:border-0">
                <td className="py-2">{formatShortDate(d.day)}</td>
                <td className="py-2 text-right tabular-nums">{d.orders}</td>
                <td className="py-2 text-right tabular-nums">{formatPrice(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex gap-3">
          {/* Y axis */}
          <div
            className="relative w-14 shrink-0 text-right text-xs text-ink-muted"
            style={{ height: PLOT_HEIGHT }}>
            {ticks.map((tick, i) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 tabular-nums"
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
                {compact(tick)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            {/* Plot */}
            <div className="relative" style={{ height: PLOT_HEIGHT }} onPointerLeave={() => setActive(null)}>
              {ticks.map((tick, i) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-line"
                  style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex">
                {days.map((d, i) => {
                  const height = (d.revenue / max) * 100;
                  const isActive = active === i;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      aria-label={`${formatShortDate(d.day)}: ${formatPrice(d.revenue)}, ${d.orders} захиалга`}
                      onPointerEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      className="relative flex h-full flex-1 items-end justify-center focus:outline-none">
                      <span
                        className={cn(
                          "block w-full max-w-6 rounded-t-[4px] transition-colors",
                          isActive ? "bg-chart-hover" : "bg-chart",
                          d.revenue > 0 && "min-h-[2px]",
                        )}
                        style={{ height: `${height}%` }}
                      />
                      {/* Direct label on today's bar only; the rest live in the tooltip and table. */}
                      {i === lastIndex && !isActive && d.revenue > 0 ? (
                        <span
                          className="pointer-events-none absolute -translate-y-full pb-1 text-xs font-semibold whitespace-nowrap text-ink"
                          style={{ bottom: `${height}%` }}>
                          {formatPrice(d.revenue)}
                        </span>
                      ) : null}
                      {isActive ? (
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute z-10 -translate-y-full rounded-lg bg-espresso px-2.5 py-1.5 text-left whitespace-nowrap text-white shadow-lg"
                          style={{ bottom: `calc(${height}% + 6px)` }}>
                          <span className="block text-sm font-semibold tabular-nums">
                            {formatPrice(d.revenue)}
                          </span>
                          <span className="block text-xs text-white/70">
                            {formatShortDate(d.day)} · {d.orders} захиалга
                          </span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* X axis */}
            <div className="mt-2 flex text-xs text-ink-muted">
              {days.map((d, i) => (
                <span
                  key={d.day}
                  className={cn(
                    "flex-1 text-center tabular-nums",
                    i === lastIndex && "font-semibold text-ink",
                  )}>
                  {i === lastIndex ? "Өнөөдөр" : formatShortDate(d.day)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
