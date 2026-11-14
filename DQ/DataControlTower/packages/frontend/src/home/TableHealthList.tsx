import type { TableStatus, TableSummaryRow } from '@/lib/dq-model';
import {
  formatCompact,
  formatDateTime,
  formatDelta,
  formatPct,
  formatRelative,
  formatScore,
} from '@/lib/format';
import { cn } from '@/lib/utils';

import { HealthBadge, LayerTag } from './primitives';

const STRIP_SLOTS = 12;

/**
 * Last runs as a tick strip: bar height = average score, colour = pass/fail
 * against the table's threshold, dashed rule = the threshold itself.
 */
function RunStrip({ history, threshold }: { history: TableSummaryRow[]; threshold: number }) {
  const empty = STRIP_SLOTS - history.length;
  return (
    <div
      className="relative flex h-600 items-end gap-100-nudge"
      role="img"
      aria-label={
        history.length
          ? `Last ${history.length} runs, scores ${history.map((h) => formatScore(h.avgDqScore)).join(', ')}`
          : 'No runs yet'
      }
    >
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} className="h-100 w-100-nudge flex-1 rounded-sm bg-muted" />
      ))}
      {history.map((h) => {
        const score = h.avgDqScore ?? 0;
        const pass = score >= threshold;
        return (
          <span
            key={h.runId || h.summaryTs.toISOString()}
            title={`${formatDateTime(h.summaryTs)} · score ${formatScore(h.avgDqScore)} · pass rate ${formatPct(h.passRatePct)}`}
            className={cn('w-100-nudge flex-1 rounded-t-sm', pass ? 'bg-good' : 'bg-critical')}
            style={{ height: `${Math.max(8, score)}%` }}
          />
        );
      })}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground"
        style={{ bottom: `${threshold}%` }}
      />
    </div>
  );
}

export function TableHealthList({ statuses }: { statuses: TableStatus[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {statuses.map((s) => {
        const delta = formatDelta(s.passRateDelta);
        return (
          <li
            key={s.source.tableId}
            className="grid grid-cols-1 items-center gap-300 py-400 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_120px]"
          >
            <div className="flex min-w-0 flex-col gap-100">
              <div className="flex min-w-0 items-center gap-200">
                <span className="truncate font-monospace text-300 font-medium" title={`${s.source.schemaName}.${s.source.tableName}`}>
                  {s.source.schemaName ? `${s.source.schemaName}.` : ''}
                  {s.source.tableName}
                </span>
                <LayerTag layer={s.source.layer} />
              </div>
              <span className="truncate text-200 text-muted-foreground">
                {s.source.lakehouseName}
                {s.source.workspaceName ? ` · ${s.source.workspaceName}` : ''}
              </span>
            </div>

            <div className="flex flex-col gap-100">
              <HealthBadge health={s.health} />
              <span className="text-200 text-muted-foreground">
                {s.latest ? `Evaluated ${formatRelative(s.latest.summaryTs)}` : 'Awaiting first run'}
              </span>
            </div>

            <div className="flex flex-col gap-100">
              <span className="text-300">
                <span className="font-numeric font-medium">{formatScore(s.latest?.avgDqScore)}</span>
                <span className="text-muted-foreground"> / {formatScore(s.source.passThreshold)} threshold</span>
              </span>
              <span className="text-200 text-muted-foreground">
                {s.latest ? (
                  <>
                    <span className="font-numeric text-foreground">{formatPct(s.latest.passRatePct)}</span> pass ·{' '}
                    {formatCompact(s.latest.totalRecords)} rec
                    {delta && <span className="font-numeric"> · {delta}</span>}
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>

            <RunStrip history={s.history} threshold={s.source.passThreshold} />
          </li>
        );
      })}
    </ul>
  );
}
