import { describe, expect, it } from 'vitest';

import {
  buildDimensionCoverage,
  buildHeadline,
  buildRunActivity,
  buildTableStatuses,
  buildTrend,
  toBool,
  toDate,
  toNumber,
  type RunRow,
  type SourceTableRow,
  type TableSummaryRow,
} from './dq-model';

function source(tableId: number, overrides: Partial<SourceTableRow> = {}): SourceTableRow {
  return {
    tableId,
    workspaceName: 'ws',
    lakehouseName: 'lh',
    schemaName: 'silver',
    tableName: `t${tableId}`,
    layer: 'silver',
    passThreshold: 80,
    isActive: true,
    ...overrides,
  };
}

function summary(
  tableId: number,
  ts: string,
  passed: number,
  total: number,
  avg: number
): TableSummaryRow {
  return {
    runId: `${tableId}-${ts}`,
    tableId,
    totalRecords: total,
    passedRecords: passed,
    failedRecords: total - passed,
    avgDqScore: avg,
    passRatePct: (passed / total) * 100,
    summaryTs: new Date(ts),
  };
}

describe('wire coercion', () => {
  it('parses DAB string values', () => {
    expect(toNumber('82.50')).toBe(82.5);
    expect(toNumber(null)).toBeNull();
    expect(toNumber('abc')).toBeNull();
    expect(toBool('true')).toBe(true);
    expect(toBool('false')).toBe(false);
    expect(toDate('2026-11-01T10:00:00Z')?.toISOString()).toBe('2026-11-01T10:00:00.000Z');
    expect(toDate('not a date')).toBeNull();
  });
});

describe('table statuses and headline', () => {
  const sources = [
    source(1, { passThreshold: 90 }),
    source(2),
    source(3),
    source(4, { isActive: false }),
  ];
  const summaries = [
    summary(1, '2026-11-12T08:00:00Z', 90, 100, 92),
    summary(1, '2026-11-13T08:00:00Z', 80, 100, 85), // latest for 1: below 90
    summary(2, '2026-11-13T09:00:00Z', 300, 300, 99), // only run for 2: healthy
    summary(4, '2026-11-13T09:00:00Z', 0, 50, 10), // inactive: ignored
  ];
  const statuses = buildTableStatuses(sources, summaries, []);

  it('uses the latest run per active table and sorts worst first', () => {
    expect(statuses.map((s) => [s.source.tableId, s.health])).toEqual([
      [1, 'below'],
      [2, 'healthy'],
      [3, 'no-data'],
    ]);
    expect(statuses[0].latest?.avgDqScore).toBe(85);
    expect(statuses[0].passRateDelta).toBeCloseTo(-10);
    expect(statuses[0].history.map((h) => h.avgDqScore)).toEqual([92, 85]);
  });

  it('aggregates record-weighted headline measures', () => {
    const h = buildHeadline(statuses);
    expect(h.activeTables).toBe(3);
    expect(h.tablesWithData).toBe(2);
    expect(h.tablesBelowThreshold).toBe(1);
    expect(h.totalRecords).toBe(400);
    expect(h.passedRecords).toBe(380);
    expect(h.passRatePct).toBeCloseTo(95);
    expect(h.avgScore).toBeCloseTo((85 * 100 + 99 * 300) / 400);
    // Only table 1 has a previous run.
    expect(h.previousPassRatePct).toBeCloseTo(90);
  });

  it('reports nothing when no runs exist', () => {
    const h = buildHeadline(buildTableStatuses(sources, [], []));
    expect(h.passRatePct).toBeNull();
    expect(h.avgScore).toBeNull();
    expect(h.lastEvaluated).toBeNull();
  });
});

describe('trend', () => {
  it('buckets by day inside the window for active tables only', () => {
    const now = new Date(2026, 10, 14, 12);
    const rows = [
      summary(1, new Date(2026, 10, 13, 9).toISOString(), 90, 100, 90),
      summary(2, new Date(2026, 10, 13, 15).toISOString(), 50, 100, 50),
      summary(1, new Date(2026, 10, 14, 9).toISOString(), 99, 100, 99),
      summary(1, new Date(2026, 9, 1, 9).toISOString(), 10, 100, 10), // outside 30d
      summary(9, new Date(2026, 10, 14, 9).toISOString(), 0, 100, 0), // inactive
    ];
    const trend = buildTrend(rows, new Set([1, 2]), 30, now);
    expect(trend.map((p) => [p.day, Math.round(p.passRatePct), p.runs])).toEqual([
      ['2026-11-13', 70, 2],
      ['2026-11-14', 99, 1],
    ]);
  });
});

describe('run activity and dimensions', () => {
  it('counts runs in the window by status', () => {
    const now = new Date('2026-11-14T12:00:00Z');
    const run = (h: number, status: string): RunRow => ({
      runId: `${h}${status}`,
      tableId: 1,
      pipelineName: null,
      runStartTs: new Date(now.getTime() - h * 3_600_000),
      runEndTs: null,
      runStatus: status,
      recordsEvaluated: null,
    });
    const a = buildRunActivity(
      [run(1, 'Succeeded'), run(2, 'Failed'), run(3, 'Running'), run(30, 'Failed')],
      24,
      now
    );
    expect(a).toMatchObject({ succeeded: 1, failed: 1, running: 1, other: 0 });
  });

  it('maps rule failures onto dimensions', () => {
    const coverage = buildDimensionCoverage(
      [
        { dimensionId: 2, dimensionName: 'Validity', description: null },
        { dimensionId: 1, dimensionName: 'Completeness', description: null },
      ],
      [
        { ruleId: 10, tableId: 1, dimensionId: 1, severity: 'Critical', isCritical: true },
        { ruleId: 11, tableId: 1, dimensionId: 1, severity: 'Low', isCritical: false },
        { ruleId: 12, tableId: 1, dimensionId: 2, severity: 'High', isCritical: false },
      ],
      [
        { ruleId: 10, failures: 5 },
        { ruleId: 11, failures: 2 },
        { ruleId: 99, failures: 7 }, // inactive rule: not attributed
      ]
    );
    expect(coverage.map((c) => [c.dimension.dimensionName, c.rules, c.critical, c.failures])).toEqual([
      ['Completeness', 2, 1, 7],
      ['Validity', 1, 0, 0],
    ]);
    expect(buildDimensionCoverage([], [], null)).toEqual([]);
  });
});
