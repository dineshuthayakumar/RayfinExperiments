import { ChevronDown, ChevronRight, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

import { EmptyNote, LayerTag, Panel, SectionError, Skeleton } from '@/home/primitives';
import { useDqRules, type DqRuleView } from '@/hooks/use-dq-rules';
import { formatDateTime, formatInt, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

type StatusFilter = 'active' | 'inactive' | 'all';

const ALL = '__all__';

const selectClass =
  'rounded-lg border border-border bg-card px-300 py-200 text-300 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const fmtDate = (d: Date | null) => (d ? shortDate.format(d) : '—');

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function SeverityTag({ severity, critical }: { severity: string; critical: boolean }) {
  return (
    <span className="inline-flex items-center gap-100 whitespace-nowrap text-200 font-medium">
      {critical && <ShieldAlert aria-label="Critical" className="icon-size-200 shrink-0 text-critical" />}
      {severity || '—'}
    </span>
  );
}

function StatusTag({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-100 whitespace-nowrap text-200 font-medium',
        active ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <span
        aria-hidden
        className={cn('inline-block size-200 rounded-full', active ? 'bg-good' : 'bg-muted-foreground')}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RuleDetail({ rule }: { rule: DqRuleView }) {
  const items: [string, string][] = [
    ['Rule ID', String(rule.ruleId)],
    ['Version', formatInt(rule.ruleVersion)],
    ['Weight', rule.weight === null ? '—' : String(rule.weight)],
    ['Effective from', fmtDate(rule.effectiveFrom)],
    ['Effective to', fmtDate(rule.effectiveTo)],
    ['Critical', rule.isCritical ? 'Yes' : 'No'],
  ];
  return (
    <div className="flex flex-col gap-400 bg-muted/40 px-500 py-400">
      <div className="flex flex-col gap-100">
        <span className="font-monospace text-200 uppercase tracking-wider text-muted-foreground">
          Rule expression
        </span>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-300 font-monospace text-200">
          {rule.ruleExpression || '—'}
        </pre>
      </div>
      <dl className="grid grid-cols-2 gap-300 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-100">
            <dt className="text-200 text-muted-foreground">{label}</dt>
            <dd className="font-numeric text-300">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RulesTable({ rules }: { rules: DqRuleView[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="-mx-500 -mb-500 overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-300">
        <thead>
          <tr className="border-b border-border text-200 uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="w-10 px-300 py-300"><span className="sr-only">Expand</span></th>
            <th scope="col" className="px-300 py-300 font-medium">Rule</th>
            <th scope="col" className="px-300 py-300 font-medium">Table</th>
            <th scope="col" className="px-300 py-300 font-medium">Column</th>
            <th scope="col" className="px-300 py-300 font-medium">Dimension</th>
            <th scope="col" className="px-300 py-300 font-medium">Severity</th>
            <th scope="col" className="px-300 py-300 text-right font-medium">Weight</th>
            <th scope="col" className="px-300 py-300 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const open = expanded.has(rule.ruleId);
            const key = `${rule.ruleId}-${rule.ruleVersion ?? 0}`;
            return (
              <Fragment key={key}>
                <tr className="border-b border-border hover:bg-hover">
                  <td className="px-300 py-300 align-top">
                    <button
                      type="button"
                      onClick={() => toggle(rule.ruleId)}
                      aria-expanded={open}
                      aria-label={`${open ? 'Hide' : 'Show'} details for ${rule.ruleName}`}
                      className="rounded-md p-100 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {open ? (
                        <ChevronDown aria-hidden className="icon-size-200" />
                      ) : (
                        <ChevronRight aria-hidden className="icon-size-200" />
                      )}
                    </button>
                  </td>
                  <td className="px-300 py-300 align-top">
                    <div className="flex flex-col">
                      <span className="font-medium">{rule.ruleName}</span>
                      <span className="font-monospace text-200 text-muted-foreground">
                        #{rule.ruleId} · v{rule.ruleVersion ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-300 py-300 align-top">
                    <span className="inline-flex items-center gap-200">
                      <span className="font-monospace text-200">{rule.tableLabel}</span>
                      <LayerTag layer={rule.layer} />
                    </span>
                  </td>
                  <td className="px-300 py-300 align-top font-monospace text-200">
                    {rule.columnName ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-300 py-300 align-top">{rule.dimensionName}</td>
                  <td className="px-300 py-300 align-top">
                    <SeverityTag severity={rule.severity} critical={rule.isCritical} />
                  </td>
                  <td className="px-300 py-300 text-right align-top font-numeric">
                    {rule.weight === null ? '—' : rule.weight}
                  </td>
                  <td className="px-300 py-300 align-top">
                    <StatusTag active={rule.isActive} />
                  </td>
                </tr>
                {open && (
                  <tr className="border-b border-border">
                    <td colSpan={8} className="p-0">
                      <RuleDetail rule={rule} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RulesBrowser({ rules }: { rules: DqRuleView[] }) {
  const [query, setQuery] = useState('');
  const [table, setTable] = useState(ALL);
  const [dimension, setDimension] = useState(ALL);
  const [severity, setSeverity] = useState(ALL);
  const [status, setStatus] = useState<StatusFilter>('active');

  const options = useMemo(
    () => ({
      tables: unique(rules.map((r) => r.tableLabel)),
      dimensions: unique(rules.map((r) => r.dimensionName)),
      severities: unique(rules.map((r) => r.severity)),
    }),
    [rules]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rules.filter(
      (r) =>
        (status === 'all' || r.isActive === (status === 'active')) &&
        (table === ALL || r.tableLabel === table) &&
        (dimension === ALL || r.dimensionName === dimension) &&
        (severity === ALL || r.severity === severity) &&
        (!q ||
          r.ruleName.toLowerCase().includes(q) ||
          (r.columnName ?? '').toLowerCase().includes(q) ||
          r.ruleExpression.toLowerCase().includes(q) ||
          String(r.ruleId) === q)
    );
  }, [rules, query, table, dimension, severity, status]);

  const activeCount = rules.filter((r) => r.isActive).length;
  const criticalCount = rules.filter((r) => r.isActive && r.isCritical).length;

  return (
    <Panel
      title="Data quality rules"
      eyebrow={`dq.dq_rule · ${formatInt(activeCount)} active · ${formatInt(criticalCount)} critical · ${formatInt(rules.length)} total`}
    >
      <div className="flex flex-col gap-400">
        <div className="flex flex-wrap items-end gap-300">
          <label className="flex min-w-[220px] flex-1 flex-col gap-100">
            <span className="text-200 text-muted-foreground">Search</span>
            <span className="relative">
              <Search
                aria-hidden
                className="icon-size-200 pointer-events-none absolute left-300 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rule name, column, expression or ID"
                className={cn(selectClass, 'w-full pl-800')}
              />
            </span>
          </label>
          <label className="flex flex-col gap-100">
            <span className="text-200 text-muted-foreground">Table</span>
            <select value={table} onChange={(e) => setTable(e.target.value)} className={selectClass}>
              <option value={ALL}>All tables</option>
              {options.tables.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-100">
            <span className="text-200 text-muted-foreground">Dimension</span>
            <select value={dimension} onChange={(e) => setDimension(e.target.value)} className={selectClass}>
              <option value={ALL}>All dimensions</option>
              {options.dimensions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-100">
            <span className="text-200 text-muted-foreground">Severity</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
              <option value={ALL}>All severities</option>
              {options.severities.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-100">
            <span className="text-200 text-muted-foreground">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className={selectClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>

        <p className="text-200 text-muted-foreground" aria-live="polite">
          Showing {formatInt(filtered.length)} of {formatInt(rules.length)} rules
        </p>

        {filtered.length === 0 ? (
          <EmptyNote>
            {rules.length === 0 ? (
              <>No rules are registered in <code className="font-monospace">dq.dq_rule</code>.</>
            ) : (
              'No rules match the current filters.'
            )}
          </EmptyNote>
        ) : (
          <RulesTable rules={filtered} />
        )}
      </div>
    </Panel>
  );
}

/** Settings page: read-only view of the DQ rule catalogue stored in the Lakehouse. */
export function SettingsPage() {
  const { state, reload, refreshing } = useDqRules();

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-600 px-400 py-600 sm:px-600 lg:px-800">
        <header className="flex flex-col gap-400 border-b border-border pb-600 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-200">
            <span className="inline-flex items-center gap-200 font-monospace text-200 uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="inline-block size-200 rounded-full bg-brand" />
              Settings
            </span>
            <h1 className="font-heading text-hero-800 font-semibold leading-hero-800 tracking-tight">
              DQ rules
            </h1>
            <p className="text-300 text-muted-foreground">
              Rules configured in the Lakehouse DQ store. Read-only — rules are maintained by the load notebook.
            </p>
          </div>
          <div className="flex items-center gap-300">
            {state.status === 'ready' && (
              <span className="text-200 text-muted-foreground" title={formatDateTime(state.loadedAt)}>
                Loaded <span className="font-numeric text-foreground">{formatRelative(state.loadedAt)}</span>
              </span>
            )}
            <button
              type="button"
              onClick={reload}
              disabled={refreshing}
              className="inline-flex items-center gap-200 rounded-lg border border-border bg-card px-300 py-200 text-300 font-medium hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw aria-hidden className={cn('icon-size-200', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </header>

        {state.status === 'loading' && (
          <div className="flex flex-col gap-300" aria-busy="true" aria-label="Loading DQ rules">
            <Skeleton className="h-12" />
            <Skeleton className="h-[420px]" />
          </div>
        )}
        {state.status === 'error' && (
          <div className="flex flex-col items-start gap-300">
            <SectionError message={state.message} />
            <button
              type="button"
              onClick={reload}
              className="rounded-lg bg-primary px-400 py-200 text-300 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Try again
            </button>
          </div>
        )}
        {state.status === 'ready' && <RulesBrowser rules={state.rules} />}
      </main>
    </div>
  );
}
