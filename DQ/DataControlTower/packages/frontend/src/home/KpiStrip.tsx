import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

import type { DqHeadline, RunActivity } from '@/lib/dq-model';
import {
  formatCompact,
  formatDelta,
  formatInt,
  formatPct,
  formatScore,
} from '@/lib/format';
import { cn } from '@/lib/utils';

function Delta({ value, unit = 'vs previous run' }: { value: number | null; unit?: string }) {
  const text = formatDelta(value);
  if (!text || value === null) {
    return <span className="text-200 text-muted-foreground">No previous run to compare</span>;
  }
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-100 text-200 text-muted-foreground">
      <Icon aria-hidden className={cn('icon-size-200', up ? 'text-good' : 'text-critical')} />
      <span className="font-numeric text-foreground">{text}</span> {unit}
    </span>
  );
}

function Tile({
  label,
  value,
  footer,
  className,
}: {
  label: string;
  value: string;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-300 rounded-2xl border border-border bg-card p-500',
        className
      )}
    >
      <span className="text-300 font-medium text-muted-foreground">{label}</span>
      <span className="font-numeric text-hero-800 font-medium leading-hero-800 tracking-tight">
        {value}
      </span>
      <div>{footer}</div>
    </div>
  );
}

/** Headline tiles: hero pass rate, then score, table health, and run activity. */
export function KpiStrip({
  headline,
  activity,
}: {
  headline: DqHeadline;
  activity: RunActivity | null;
}) {
  const hasData = headline.passRatePct !== null;
  const passShare = hasData ? headline.passedRecords / Math.max(1, headline.totalRecords) : 0;
  const passDelta =
    headline.passRatePct !== null && headline.previousPassRatePct !== null
      ? headline.passRatePct - headline.previousPassRatePct
      : null;
  const scoreDelta =
    headline.avgScore !== null && headline.previousAvgScore !== null
      ? headline.avgScore - headline.previousAvgScore
      : null;

  return (
    <div className="grid grid-cols-1 gap-400 sm:grid-cols-2 xl:grid-cols-5">
      {/* Hero */}
      <div className="flex flex-col gap-400 rounded-2xl border border-border bg-card p-500 sm:col-span-2">
        <div className="flex items-baseline justify-between gap-300">
          <span className="text-300 font-medium text-muted-foreground">Record pass rate</span>
          <span className="font-monospace text-200 text-muted-foreground">latest run per table</span>
        </div>
        <div className="flex flex-wrap items-end gap-x-500 gap-y-200">
          <span className="font-numeric text-hero-1000 font-medium leading-hero-1000 tracking-tighter">
            {hasData ? formatPct(headline.passRatePct) : '—'}
          </span>
          <div className="pb-300">
            <Delta value={passDelta} />
          </div>
        </div>
        <div className="flex flex-col gap-200">
          <div
            className="flex h-200 w-full gap-100-nudge overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={
              hasData
                ? `${formatInt(headline.passedRecords)} passed, ${formatInt(headline.failedRecords)} failed`
                : 'No records evaluated yet'
            }
          >
            {hasData && (
              <>
                <div className="h-full rounded-l-full bg-good" style={{ width: `${passShare * 100}%` }} />
                <div className="h-full flex-1 rounded-r-full bg-critical" />
              </>
            )}
          </div>
          <div className="flex justify-between text-200 text-muted-foreground">
            <span>
              <span className="font-numeric text-foreground">{formatCompact(headline.passedRecords)}</span> passed
            </span>
            <span>
              <span className="font-numeric text-foreground">{formatCompact(headline.failedRecords)}</span> failed
              {' · '}
              <span className="font-numeric text-foreground">{formatCompact(headline.totalRecords)}</span> evaluated
            </span>
          </div>
        </div>
      </div>

      <Tile
        label="Average DQ score"
        value={formatScore(headline.avgScore)}
        footer={hasData ? <Delta value={scoreDelta} /> : <span className="text-200 text-muted-foreground">Weighted by records, 0–100</span>}
      />

      <Tile
        label="Tables below threshold"
        value={`${formatInt(headline.tablesBelowThreshold)}`}
        footer={
          <span className="text-200 text-muted-foreground">
            of <span className="font-numeric text-foreground">{formatInt(headline.activeTables)}</span> monitored
            {headline.activeTables > headline.tablesWithData &&
              ` · ${formatInt(headline.activeTables - headline.tablesWithData)} not yet run`}
          </span>
        }
      />

      <Tile
        label={`Runs, last ${activity?.windowHours ?? 24}h`}
        value={activity ? formatInt(activity.succeeded + activity.failed + activity.running + activity.other) : '—'}
        footer={
          activity ? (
            <span className="text-200 text-muted-foreground">
              <span className="font-numeric text-foreground">{activity.succeeded}</span> succeeded ·{' '}
              <span className={cn('font-numeric', activity.failed ? 'font-semibold text-foreground' : 'text-foreground')}>
                {activity.failed}
              </span>{' '}
              failed
              {activity.running > 0 && ` · ${activity.running} running`}
            </span>
          ) : (
            <span className="text-200 text-muted-foreground">Run history unavailable</span>
          )
        }
      />
    </div>
  );
}
