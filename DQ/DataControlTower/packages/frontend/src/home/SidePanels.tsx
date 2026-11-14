import type { DimensionCoverage, RunRow, SourceTableRow } from '@/lib/dq-model';
import { formatCompact, formatDuration, formatInt, formatRelative } from '@/lib/format';

import { EmptyNote, RunStatusBadge } from './primitives';

/** Stacked pass (green) / fail (red) split of rule checks for one dimension. */
function ResultBar({ successes, failures }: { successes: number | null; failures: number | null }) {
  const pass = successes ?? 0;
  const fail = failures ?? 0;
  const total = pass + fail;
  const known = successes !== null || failures !== null;
  const passPct = total > 0 ? (pass / total) * 100 : 0;
  const failPct = total > 0 ? (fail / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-100">
      <div
        className="flex h-200 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={known ? `${pass} passed, ${fail} failed` : 'Results unavailable'}
      >
        {passPct > 0 && (
          <div className="h-full bg-good" style={{ width: `${passPct}%` }} title={`${formatInt(pass)} passed`} />
        )}
        {failPct > 0 && (
          <div className="h-full bg-critical" style={{ width: `${failPct}%` }} title={`${formatInt(fail)} failed`} />
        )}
      </div>
      <div className="flex justify-between font-numeric text-200 text-muted-foreground">
        <span>
          <span className="mr-100 inline-block size-100 rounded-full bg-good" aria-hidden />
          {known ? formatCompact(pass) : '—'} passed
        </span>
        <span>
          <span className="mr-100 inline-block size-100 rounded-full bg-critical" aria-hidden />
          {known ? formatCompact(fail) : '—'} failed
        </span>
      </div>
    </div>
  );
}

/** Rules and recent pass/fail results per DQ dimension. */
export function DimensionList({
  coverage,
  failureWindowDays,
}: {
  coverage: DimensionCoverage[];
  failureWindowDays: number;
}) {
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
            <ResultBar successes={c.successes} failures={c.failures} />
          </li>
        ))}
      </ul>
      <p className="text-200 text-muted-foreground">
        {failuresKnown
          ? `Bars show passed vs failed rule checks over the last ${failureWindowDays} days.`
          : 'Result counts are unavailable right now.'}
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
