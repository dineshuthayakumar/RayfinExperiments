// Data-quality home page model.
//
// Row types mirror the dq.* tables in ProductLakehouse (see DDL/ and
// "DQ Data Model.md"). Everything below the row types is pure, so the
// derivations can be unit-tested without a live connector.

export type SourceTableRow = {
  tableId: number;
  workspaceName: string;
  lakehouseName: string;
  schemaName: string;
  tableName: string;
  layer: string;
  passThreshold: number;
  isActive: boolean;
};

export type TableSummaryRow = {
  runId: string;
  tableId: number;
  totalRecords: number;
  passedRecords: number;
  failedRecords: number;
  avgDqScore: number | null;
  passRatePct: number | null;
  summaryTs: Date;
};

export type RunRow = {
  runId: string;
  tableId: number;
  pipelineName: string | null;
  runStartTs: Date;
  runEndTs: Date | null;
  runStatus: string;
  recordsEvaluated: number | null;
};

export type RuleRow = {
  ruleId: number;
  tableId: number;
  dimensionId: number;
  severity: string;
  isCritical: boolean;
};

export type DimensionRow = {
  dimensionId: number;
  dimensionName: string;
  description: string | null;
};

/** Failed rule results in the recent window, grouped by rule. */
export type RuleFailureRow = { ruleId: number; failures: number };

// ---------------------------------------------------------------------------
// Wire coercion. DAB may return decimals, booleans and dates as strings.
// ---------------------------------------------------------------------------

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toBool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

export type TableHealth = 'healthy' | 'below' | 'no-data';

export type TableStatus = {
  source: SourceTableRow;
  latest: TableSummaryRow | null;
  /** Up to the last 12 summaries, oldest first. */
  history: TableSummaryRow[];
  health: TableHealth;
  /** Pass-rate change vs the previous run, in percentage points. */
  passRateDelta: number | null;
  lastRun: RunRow | null;
};

export type DqHeadline = {
  activeTables: number;
  tablesWithData: number;
  tablesBelowThreshold: number;
  totalRecords: number;
  passedRecords: number;
  failedRecords: number;
  /** 0–100, null when nothing has been evaluated. */
  passRatePct: number | null;
  /** Record-weighted average dq_score, 0–100. */
  avgScore: number | null;
  /** Same measures over each table's previous run, for deltas. */
  previousPassRatePct: number | null;
  previousAvgScore: number | null;
  lastEvaluated: Date | null;
};

export type TrendPoint = {
  day: string; // yyyy-mm-dd (local)
  date: Date;
  passRatePct: number;
  totalRecords: number;
  runs: number;
};

export type RunActivity = {
  windowHours: number;
  succeeded: number;
  failed: number;
  running: number;
  other: number;
};

export type DimensionCoverage = {
  dimension: DimensionRow;
  rules: number;
  critical: number;
  /** Failed rule results in the recent window; null when unavailable. */
  failures: number | null;
};

export function passRate(passed: number, total: number): number | null {
  return total > 0 ? (passed / total) * 100 : null;
}

function rowScore(row: TableSummaryRow): number | null {
  if (row.avgDqScore !== null) return row.avgDqScore;
  return null;
}

function rowPassRate(row: TableSummaryRow): number | null {
  return row.passRatePct ?? passRate(row.passedRecords, row.totalRecords);
}

/** Groups summaries by table, newest first (input order is not assumed). */
export function summariesByTable(
  summaries: readonly TableSummaryRow[]
): Map<number, TableSummaryRow[]> {
  const sorted = [...summaries].sort(
    (a, b) => b.summaryTs.getTime() - a.summaryTs.getTime()
  );
  const map = new Map<number, TableSummaryRow[]>();
  for (const row of sorted) {
    const list = map.get(row.tableId);
    if (list) list.push(row);
    else map.set(row.tableId, [row]);
  }
  return map;
}

export function healthOf(
  latest: TableSummaryRow | null,
  threshold: number
): TableHealth {
  if (!latest) return 'no-data';
  const score = rowScore(latest);
  if (score === null) return 'no-data';
  return score >= threshold ? 'healthy' : 'below';
}

const HEALTH_ORDER: Record<TableHealth, number> = {
  below: 0,
  healthy: 1,
  'no-data': 2,
};

export function buildTableStatuses(
  sources: readonly SourceTableRow[],
  summaries: readonly TableSummaryRow[],
  runs: readonly RunRow[]
): TableStatus[] {
  const byTable = summariesByTable(summaries);
  const lastRunByTable = new Map<number, RunRow>();
  for (const run of [...runs].sort(
    (a, b) => b.runStartTs.getTime() - a.runStartTs.getTime()
  )) {
    if (!lastRunByTable.has(run.tableId)) lastRunByTable.set(run.tableId, run);
  }

  return sources
    .filter((s) => s.isActive)
    .map((source) => {
      const list = byTable.get(source.tableId) ?? [];
      const latest = list[0] ?? null;
      const previous = list[1] ?? null;
      const latestRate = latest ? rowPassRate(latest) : null;
      const previousRate = previous ? rowPassRate(previous) : null;
      return {
        source,
        latest,
        history: list.slice(0, 12).reverse(),
        health: healthOf(latest, source.passThreshold),
        passRateDelta:
          latestRate !== null && previousRate !== null
            ? latestRate - previousRate
            : null,
        lastRun: lastRunByTable.get(source.tableId) ?? null,
      };
    })
    .sort((a, b) => {
      const byHealth = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];
      if (byHealth !== 0) return byHealth;
      const aScore = a.latest ? (rowScore(a.latest) ?? 0) - a.source.passThreshold : 0;
      const bScore = b.latest ? (rowScore(b.latest) ?? 0) - b.source.passThreshold : 0;
      if (aScore !== bScore) return aScore - bScore;
      return a.source.tableName.localeCompare(b.source.tableName);
    });
}

function aggregate(rows: readonly TableSummaryRow[]) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let scoreWeight = 0;
  let scoreSum = 0;
  for (const row of rows) {
    total += row.totalRecords;
    passed += row.passedRecords;
    failed += row.failedRecords;
    const score = rowScore(row);
    if (score !== null && row.totalRecords > 0) {
      scoreSum += score * row.totalRecords;
      scoreWeight += row.totalRecords;
    }
  }
  return {
    total,
    passed,
    failed,
    passRatePct: passRate(passed, total),
    avgScore: scoreWeight > 0 ? scoreSum / scoreWeight : null,
  };
}

export function buildHeadline(statuses: readonly TableStatus[]): DqHeadline {
  const latestRows = statuses.flatMap((s) => (s.latest ? [s.latest] : []));
  const previousRows = statuses.flatMap((s) =>
    s.history.length >= 2 ? [s.history[s.history.length - 2]] : []
  );
  const current = aggregate(latestRows);
  const previous = aggregate(previousRows);
  const lastEvaluated = latestRows.reduce<Date | null>(
    (max, row) => (!max || row.summaryTs > max ? row.summaryTs : max),
    null
  );

  return {
    activeTables: statuses.length,
    tablesWithData: latestRows.length,
    tablesBelowThreshold: statuses.filter((s) => s.health === 'below').length,
    totalRecords: current.total,
    passedRecords: current.passed,
    failedRecords: current.failed,
    passRatePct: current.passRatePct,
    avgScore: current.avgScore,
    previousPassRatePct: previousRows.length ? previous.passRatePct : null,
    previousAvgScore: previousRows.length ? previous.avgScore : null,
    lastEvaluated,
  };
}

function localDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Daily record-weighted pass rate across active tables, oldest first. */
export function buildTrend(
  summaries: readonly TableSummaryRow[],
  activeTableIds: ReadonlySet<number>,
  days: number,
  now: Date = new Date()
): TrendPoint[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<
    string,
    { date: Date; passed: number; total: number; runs: number }
  >();
  for (const row of summaries) {
    if (!activeTableIds.has(row.tableId) || row.summaryTs < start) continue;
    const key = localDay(row.summaryTs);
    const bucket = buckets.get(key) ?? {
      date: new Date(
        row.summaryTs.getFullYear(),
        row.summaryTs.getMonth(),
        row.summaryTs.getDate()
      ),
      passed: 0,
      total: 0,
      runs: 0,
    };
    bucket.passed += row.passedRecords;
    bucket.total += row.totalRecords;
    bucket.runs += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .filter(([, b]) => b.total > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, b]) => ({
      day,
      date: b.date,
      passRatePct: (b.passed / b.total) * 100,
      totalRecords: b.total,
      runs: b.runs,
    }));
}

export function buildRunActivity(
  runs: readonly RunRow[],
  windowHours: number,
  now: Date = new Date()
): RunActivity {
  const since = now.getTime() - windowHours * 3_600_000;
  const activity: RunActivity = {
    windowHours,
    succeeded: 0,
    failed: 0,
    running: 0,
    other: 0,
  };
  for (const run of runs) {
    if (run.runStartTs.getTime() < since) continue;
    const status = run.runStatus.toLowerCase();
    if (status === 'succeeded') activity.succeeded += 1;
    else if (status === 'failed') activity.failed += 1;
    else if (status === 'running') activity.running += 1;
    else activity.other += 1;
  }
  return activity;
}

export function buildDimensionCoverage(
  dimensions: readonly DimensionRow[],
  rules: readonly RuleRow[],
  failures: readonly RuleFailureRow[] | null
): DimensionCoverage[] {
  const ruleDimension = new Map(rules.map((r) => [r.ruleId, r.dimensionId]));
  const failuresByDimension = new Map<number, number>();
  if (failures) {
    for (const f of failures) {
      const dim = ruleDimension.get(f.ruleId);
      if (dim === undefined) continue;
      failuresByDimension.set(dim, (failuresByDimension.get(dim) ?? 0) + f.failures);
    }
  }

  return [...dimensions]
    .sort((a, b) => a.dimensionId - b.dimensionId)
    .map((dimension) => {
      const dimRules = rules.filter((r) => r.dimensionId === dimension.dimensionId);
      return {
        dimension,
        rules: dimRules.length,
        critical: dimRules.filter((r) => r.isCritical).length,
        failures: failures ? (failuresByDimension.get(dimension.dimensionId) ?? 0) : null,
      };
    });
}
