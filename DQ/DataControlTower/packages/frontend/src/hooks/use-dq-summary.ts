import { useCallback, useEffect, useState } from 'react';

import {
  toBool,
  toDate,
  toNumber,
  toText,
  type DimensionRow,
  type RuleFailureRow,
  type RuleRow,
  type RunRow,
  type SourceTableRow,
  type TableSummaryRow,
} from '@/lib/dq-model';
import { getRayfinClient } from '@/lib/rayfin-client';

/** Days of rule-result history used for "failures by dimension". */
export const FAILURE_WINDOW_DAYS = 7;

const SUMMARY_LIMIT = 2000;
const RUN_LIMIT = 200;
const RULE_LIMIT = 5000;
const SOURCE_LIMIT = 1000;

export type Section<T> =
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

export type DqSummaryData = {
  sources: Section<SourceTableRow[]>;
  summaries: Section<TableSummaryRow[]>;
  runs: Section<RunRow[]>;
  rules: Section<RuleRow[]>;
  dimensions: Section<DimensionRow[]>;
  failures: Section<RuleFailureRow[]>;
  loadedAt: Date;
};

export type DqSummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DqSummaryData };

type Connector = Awaited<ReturnType<typeof getRayfinClient>>['connectors']['dqlakehouse'];

async function loadSources(dq: Connector): Promise<SourceTableRow[]> {
  const rows = await dq.DqSourceTable.select([
    'tableId',
    'workspaceName',
    'lakehouseName',
    'schemaName',
    'tableName',
    'layer',
    'passThreshold',
    'isActive',
  ])
    .first(SOURCE_LIMIT)
    .execute();
  return rows.map((r) => ({
    tableId: toNumber(r.tableId) ?? 0,
    workspaceName: toText(r.workspaceName) ?? '',
    lakehouseName: toText(r.lakehouseName) ?? '',
    schemaName: toText(r.schemaName) ?? '',
    tableName: toText(r.tableName) ?? `table ${r.tableId}`,
    layer: (toText(r.layer) ?? '').toLowerCase(),
    passThreshold: toNumber(r.passThreshold) ?? 0,
    isActive: toBool(r.isActive),
  }));
}

async function loadSummaries(dq: Connector): Promise<TableSummaryRow[]> {
  const rows = await dq.DqTableSummary.select([
    'runId',
    'tableId',
    'totalRecords',
    'passedRecords',
    'failedRecords',
    'avgDqScore',
    'passRatePct',
    'summaryTs',
  ])
    .orderBy({ summaryTs: 'desc' })
    .first(SUMMARY_LIMIT)
    .execute();
  return rows.flatMap((r) => {
    const summaryTs = toDate(r.summaryTs);
    if (!summaryTs) return [];
    return [
      {
        runId: toText(r.runId) ?? '',
        tableId: toNumber(r.tableId) ?? 0,
        totalRecords: toNumber(r.totalRecords) ?? 0,
        passedRecords: toNumber(r.passedRecords) ?? 0,
        failedRecords: toNumber(r.failedRecords) ?? 0,
        avgDqScore: toNumber(r.avgDqScore),
        passRatePct: toNumber(r.passRatePct),
        summaryTs,
      },
    ];
  });
}

async function loadRuns(dq: Connector): Promise<RunRow[]> {
  const rows = await dq.DqRun.select([
    'runId',
    'tableId',
    'pipelineName',
    'runStartTs',
    'runEndTs',
    'runStatus',
    'recordsEvaluated',
  ])
    .orderBy({ runStartTs: 'desc' })
    .first(RUN_LIMIT)
    .execute();
  return rows.flatMap((r) => {
    const runStartTs = toDate(r.runStartTs);
    if (!runStartTs) return [];
    return [
      {
        runId: toText(r.runId) ?? '',
        tableId: toNumber(r.tableId) ?? 0,
        pipelineName: toText(r.pipelineName),
        runStartTs,
        runEndTs: toDate(r.runEndTs),
        runStatus: toText(r.runStatus) ?? 'Unknown',
        recordsEvaluated: toNumber(r.recordsEvaluated),
      },
    ];
  });
}

async function loadRules(dq: Connector): Promise<RuleRow[]> {
  const rows = await dq.DqRule.select([
    'ruleId',
    'tableId',
    'dimensionId',
    'severity',
    'isCritical',
  ])
    .where({ isActive: { eq: true } })
    .first(RULE_LIMIT)
    .execute();
  return rows.map((r) => ({
    ruleId: toNumber(r.ruleId) ?? 0,
    tableId: toNumber(r.tableId) ?? 0,
    dimensionId: toNumber(r.dimensionId) ?? 0,
    severity: toText(r.severity) ?? '',
    isCritical: toBool(r.isCritical),
  }));
}

async function loadDimensions(dq: Connector): Promise<DimensionRow[]> {
  const rows = await dq.DqDimension.select([
    'dimensionId',
    'dimensionName',
    'description',
  ]).execute();
  return rows.map((r) => ({
    dimensionId: toNumber(r.dimensionId) ?? 0,
    dimensionName: toText(r.dimensionName) ?? '',
    description: toText(r.description),
  }));
}

/** Failed rule results over the recent window, counted server-side per rule. */
async function loadFailures(dq: Connector): Promise<RuleFailureRow[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (FAILURE_WINDOW_DAYS - 1));

  const rows = await dq.DqRuleResult.where({
    isPassed: { eq: false },
    evaluationDate: { gte: since },
  })
    .groupBy(['ruleId'])
    .aggregate({ failures: { count: 'ruleId' } })
    .execute();
  return rows.map((r) => ({
    ruleId: toNumber(r.fields.ruleId) ?? 0,
    failures: toNumber(r.aggregations.failures) ?? 0,
  }));
}

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function settle<T>(result: PromiseSettledResult<T>, what: string): Section<T> {
  return result.status === 'fulfilled'
    ? { status: 'ready', data: result.value }
    : { status: 'error', message: toMessage(result.reason, `Couldn't load ${what}.`) };
}

async function loadAll(): Promise<DqSummaryData> {
  const client = await getRayfinClient();
  const dq = client.connectors.dqlakehouse;
  const [sources, summaries, runs, rules, dimensions, failures] =
    await Promise.allSettled([
      loadSources(dq),
      loadSummaries(dq),
      loadRuns(dq),
      loadRules(dq),
      loadDimensions(dq),
      loadFailures(dq),
    ]);
  return {
    sources: settle(sources, 'source tables'),
    summaries: settle(summaries, 'run summaries'),
    runs: settle(runs, 'DQ runs'),
    rules: settle(rules, 'rules'),
    dimensions: settle(dimensions, 'dimensions'),
    failures: settle(failures, 'rule failures'),
    loadedAt: new Date(),
  };
}

/** Loads everything the DQ home page needs from the dq schema. */
export function useDqSummary() {
  const [state, setState] = useState<DqSummaryState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadAll()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            message: toMessage(error, 'Unable to reach the DQ store.'),
          });
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setRefreshing(true);
    setAttempt((n) => n + 1);
  }, []);

  return { state, reload, refreshing };
}
