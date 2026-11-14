import type { DimensionCoverage, RunRow, SourceTableRow } from '@/lib/dq-model';
import { formatCompact, formatDuration, formatInt, formatRelative } from '@/lib/format';

import { EmptyNote, RunStatusBadge } from './primitives';

/** Rules and recent failures per DQ dimension. Bars share one scale (failures). */
export function DimensionList({
  coverage,
  failureWindowDays,
}: {
  coverage: DimensionCoverage[];
  failureWindowDays: number;
}) {
  const maxFailures = Math.max(0, ...coverage.map((c) => c.failures ?? 0));
  const failuresKnown = coverage.some((c) => c.failures !== null);

  return (
    <div className="flex flex-col gap-400">
      <ul className="flex flex-col gap-300">
        {coverage.map((c) => (
          <li key={c.dimension.dimensionId} className="flex flex-col gap-100">
            <div className="flex items-baseline justify-between gap-200">
              <span className="text-300 font-medium" title={c.dimension.description ?? undefined}>
                {c.dimension.dimensionName}
              </span>
              <span className="text-200 text-muted-foreground">
                <span className="font-numeric text-foreground">{c.rules}</span> rule{c.rules === 1 ? '' : 's'}
                {c.critical > 0 && (
                  <>
                    {' · '}
                    <span className="font-numeric text-foreground">{c.critical}</span> critical
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-200">
              <div className="h-200 flex-1 overflow-hidden rounded-full bg-muted">
                {maxFailures > 0 && (c.failures ?? 0) > 0 && (
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${((c.failures ?? 0) / maxFailures) * 100}%` }}
                  />
                )}
              </div>
              <span className="w-800 text-right font-numeric text-200 text-muted-foreground">
                {c.failures === null ? '—' : formatCompact(c.failures)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-200 text-muted-foreground">
        {failuresKnown
          ? `Bars show failed rule checks over the last ${failureWindowDays} days.`
          : 'Failure counts are unavailable right now.'}
      </p>
    </div>
  );
}

export function RecentRuns({
  runs,
  sources,
  limit = 8,
}: {
  runs: RunRow[];
  sources: SourceTableRow[];
  limit?: number;
}) {
  if (runs.length === 0) return <EmptyNote>No DQ runs have been recorded yet.</EmptyNote>;
  const names = new Map(sources.map((s) => [s.tableId, s.tableName]));
  return (
    <ol className="flex flex-col divide-y divide-border">
      {runs.slice(0, limit).map((run) => (
        <li key={run.runId} className="flex flex-col gap-100 py-300 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-200">
            <span className="truncate font-monospace text-300">
              {names.get(run.tableId) ?? `table ${run.tableId}`}
            </span>
            <RunStatusBadge status={run.runStatus} />
          </div>
          <span className="truncate text-200 text-muted-foreground">
            {formatRelative(run.runStartTs)} · {formatDuration(run.runStartTs, run.runEndTs)}
            {run.recordsEvaluated !== null && ` · ${formatInt(run.recordsEvaluated)} records`}
            {run.pipelineName && ` · ${run.pipelineName}`}
          </span>
        </li>
      ))}
    </ol>
  );
}
