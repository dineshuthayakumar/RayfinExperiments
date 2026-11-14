import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

import type { TrendPoint } from '@/lib/dq-model';
import { formatInt, formatPct, formatShortDate } from '@/lib/format';

const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Single-series daily pass rate. One series → no legend; the panel title names it. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (width <= 0 || points.length === 0) return null;
    const innerW = Math.max(1, width - PAD.left - PAD.right);
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const min = Math.min(...points.map((p) => p.passRatePct));
    const yMin = Math.max(0, Math.floor((min - 2) / 10) * 10);
    const yMax = 100;
    const t0 = points[0].date.getTime();
    const t1 = points[points.length - 1].date.getTime();
    const x = (p: TrendPoint) =>
      PAD.left + (t1 === t0 ? innerW / 2 : ((p.date.getTime() - t0) / (t1 - t0)) * innerW);
    const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;
    const coords = points.map((p) => ({ x: x(p), y: y(p.passRatePct) }));
    const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' ');
    const area = `${line} L${coords[coords.length - 1].x},${y(yMin)} L${coords[0].x},${y(yMin)} Z`;
    const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
    const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 90))));
    return { coords, line, area, ticks, y, yMin, labelEvery };
  }, [points, width]);

  function onMove(event: PointerEvent<SVGRectElement>) {
    if (!geometry) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left + PAD.left;
    let best = 0;
    for (let i = 1; i < geometry.coords.length; i++) {
      if (Math.abs(geometry.coords[i].x - px) < Math.abs(geometry.coords[best].x - px)) best = i;
    }
    setHover(best);
  }

  const active = hover !== null && geometry ? { p: points[hover], c: geometry.coords[hover] } : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {geometry && (
        <svg width={width} height={HEIGHT} role="img" aria-label="Daily record pass rate" className="block">
          {geometry.ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={geometry.y(t)}
                y2={geometry.y(t)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={geometry.y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground font-numeric text-200"
              >
                {t.toFixed(0)}%
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % geometry.labelEvery === 0 || i === points.length - 1 ? (
              <text
                key={p.day}
                x={geometry.coords[i].x}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-200"
              >
                {formatShortDate(p.date)}
              </text>
            ) : null
          )}
          <path d={geometry.area} className="fill-brand" fillOpacity={0.12} />
          <path
            d={geometry.line}
            fill="none"
            className="stroke-brand-foreground"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.length === 1 && (
            <circle cx={geometry.coords[0].x} cy={geometry.coords[0].y} r={4} className="fill-brand-foreground" />
          )}
          {active && (
            <g pointerEvents="none">
              <line
                x1={active.c.x}
                x2={active.c.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                className="stroke-muted-foreground"
                strokeDasharray="3 3"
              />
              <circle
                cx={active.c.x}
                cy={active.c.y}
                r={5}
                className="fill-brand-foreground stroke-card"
                strokeWidth={2}
              />
            </g>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={Math.max(0, width - PAD.left - PAD.right)}
            height={HEIGHT - PAD.top - PAD.bottom}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {active && (
        <div
          className="pointer-events-none absolute z-10 flex min-w-[140px] flex-col gap-100 rounded-lg border border-border bg-popover px-300 py-200 text-200 text-popover-foreground shadow-md"
          style={{
            left: Math.min(Math.max(active.c.x - 70, 0), Math.max(0, width - 150)),
            top: Math.max(0, active.c.y - 76),
          }}
        >
          <span className="text-muted-foreground">{formatShortDate(active.p.date)}</span>
          <span className="font-numeric text-300 font-medium">{formatPct(active.p.passRatePct)}</span>
          <span className="text-muted-foreground">
            {formatInt(active.p.totalRecords)} records · {active.p.runs} run{active.p.runs === 1 ? '' : 's'}
          </span>
        </div>
      )}
      <table className="sr-only">
        <caption>Daily record pass rate</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Pass rate</th>
            <th>Records</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{p.day}</td>
              <td>{formatPct(p.passRatePct)}</td>
              <td>{formatInt(p.totalRecords)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
