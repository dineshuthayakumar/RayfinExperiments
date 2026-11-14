import { useCallback, useEffect, useState } from 'react';

import { toBool, toDate, toNumber, toText } from '@/lib/dq-model';
import { getRayfinClient } from '@/lib/rayfin-client';

const RULE_LIMIT = 5000;
const LOOKUP_LIMIT = 1000;

/** One row of dq.dq_rule, with its source table and dimension resolved for display. */
export type DqRuleView = {
  ruleId: number;
  ruleName: string;
  tableId: number;
  tableLabel: string;
  layer: string;
  dimensionId: number;
  dimensionName: string;
  columnName: string | null;
  ruleExpression: string;
  weight: number | null;
  severity: string;
  isCritical: boolean;
  ruleVersion: number | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  isActive: boolean;
};

export type DqRulesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rules: DqRuleView[]; loadedAt: Date };

async function loadRules(): Promise<DqRuleView[]> {
  const client = await getRayfinClient();
  const dq = client.connectors.dqlakehouse;

  const [rules, sources, dimensions] = await Promise.all([
    dq.DqRule.select([
      'ruleId',
      'tableId',
      'dimensionId',
      'ruleName',
      'columnName',
      'ruleExpression',
      'weight',
      'severity',
      'isCritical',
      'ruleVersion',
      'effectiveFrom',
      'effectiveTo',
      'isActive',
    ])
      .first(RULE_LIMIT)
      .execute(),
    dq.DqSourceTable.select(['tableId', 'schemaName', 'tableName', 'layer'])
      .first(LOOKUP_LIMIT)
      .execute(),
    dq.DqDimension.select(['dimensionId', 'dimensionName']).first(LOOKUP_LIMIT).execute(),
  ]);

  const tableById = new Map(
    sources.map((s) => {
      const schema = toText(s.schemaName);
      const table = toText(s.tableName) ?? `table ${s.tableId}`;
      return [
        toNumber(s.tableId) ?? 0,
        { label: schema ? `${schema}.${table}` : table, layer: (toText(s.layer) ?? '').toLowerCase() },
      ] as const;
    })
  );
  const dimensionById = new Map(
    dimensions.map((d) => [toNumber(d.dimensionId) ?? 0, toText(d.dimensionName) ?? ''] as const)
  );

  return rules
    .map((r): DqRuleView => {
      const tableId = toNumber(r.tableId) ?? 0;
      const dimensionId = toNumber(r.dimensionId) ?? 0;
      const table = tableById.get(tableId);
      return {
        ruleId: toNumber(r.ruleId) ?? 0,
        ruleName: toText(r.ruleName) ?? `rule ${r.ruleId}`,
        tableId,
        tableLabel: table?.label ?? `table ${tableId}`,
        layer: table?.layer ?? '',
        dimensionId,
        dimensionName: dimensionById.get(dimensionId) || `dimension ${dimensionId}`,
        columnName: toText(r.columnName),
        ruleExpression: toText(r.ruleExpression) ?? '',
        weight: toNumber(r.weight),
        severity: toText(r.severity) ?? '',
        isCritical: toBool(r.isCritical),
        ruleVersion: toNumber(r.ruleVersion),
        effectiveFrom: toDate(r.effectiveFrom),
        effectiveTo: toDate(r.effectiveTo),
        isActive: toBool(r.isActive),
      };
    })
    .sort(
      (a, b) =>
        a.tableLabel.localeCompare(b.tableLabel) ||
        a.dimensionName.localeCompare(b.dimensionName) ||
        a.ruleId - b.ruleId
    );
}

/** Loads every DQ rule from the Lakehouse (read-only). */
export function useDqRules() {
  const [state, setState] = useState<DqRulesState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadRules()
      .then((rules) => {
        if (!cancelled) setState({ status: 'ready', rules, loadedAt: new Date() });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            message:
              error instanceof Error && error.message ? error.message : "Couldn't load DQ rules.",
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
