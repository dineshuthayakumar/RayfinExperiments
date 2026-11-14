import { Database, Moon, RefreshCw, Sun } from 'lucide-react';
import { useContext, useMemo } from 'react';

import { FAILURE_WINDOW_DAYS, useDqSummary, type DqSummaryData, type Section } from '@/hooks/use-dq-summary';
import { ThemeContext } from '@/hooks/theme.context';
import {
  buildDimensionCoverage,
  buildHeadline,
  buildRunActivity,
  buildTableStatuses,
  buildTrend,
} from '@/lib/dq-model';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

import { KpiStrip } from './KpiStrip';
import { EmptyNote, Panel, SectionError, Skeleton } from './primitives';
import { DimensionList, RecentRuns } from './SidePanels';
import { TableHealthList } from './TableHealthList';
import { TrendChart } from './TrendChart';

const TREND_DAYS = 30;

function dataOr<T>(section: Section<T>, fallback: T): T {
  return section.status === 'ready' ? section.data : fallback;
}

function Header({
  lastEvaluated,
  onRefresh,
  refreshing,
}: {
  lastEvaluated: Date | null | undefined;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  return (
    <header className="flex flex-col gap-400 border-b border-border pb-600 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-200">
        <span className="inline-flex items-center gap-200 font-monospace text-200 uppercase tracking-widest text-muted-foreground">
          <span aria-hidden className="inline-block size-200 rounded-full bg-brand" />
          Data Control Tower
        </span>
        <h1 className="font-heading text-hero-800 font-semibold leading-hero-800 tracking-tight">
          Data quality summary
        </h1>
        <p className="text-300 text-muted-foreground">
          Record-level scores from the central DQ store, by source table.
        </p>
      </div>
      <div className="flex items-center gap-300">
        {lastEvaluated !== undefined && (
          <span className="text-200 text-muted-foreground" title={formatDateTime(lastEvaluated)}>
            Last evaluated{' '}
            <span className="font-numeric text-foreground">
              {lastEvaluated ? formatRelative(lastEvaluated) : 'never'}
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-200 rounded-lg border border-border bg-card px-300 py-200 text-300 font-medium hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw aria-hidden className={cn('icon-size-200', refreshing && 'animate-spin')} />
          Refresh
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-200 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {isDark ? <Sun aria-hidden className="icon-size-200" /> : <Moon aria-hidden className="icon-size-200" />}
        </button>
      </div>
    </header>
  );
}

function LoadingBody() {
  return (
    <div className="flex flex-col gap-600" aria-busy="true" aria-label="Loading data quality summary">
      <div className="grid grid-cols-1 gap-400 sm:grid-cols-2 xl:grid-cols-5">
        <Skeleton className="h-[188px] sm:col-span-2" />
        <Skeleton className="h-[188px]" />
        <Skeleton className="h-[188px]" />
        <Skeleton className="h-[188px]" />
      </div>
      <div className="grid grid-cols-1 gap-400 lg:grid-cols-12">
        <Skeleton className="h-[300px] lg:col-span-8" />
        <Skeleton className="h-[300px] lg:col-span-4" />
      </div>
    </div>
  );
}

function NoRunsBanner({ data }: { data: DqSummaryData }) {
  const sources = dataOr(data.sources, []);
  const rules = dataOr(data.rules, []);
  const dimensions = dataOr(data.dimensions, []);
  return (
    <div className="flex items-start gap-300 rounded-2xl border border-border bg-accent p-500 text-accent-foreground">
      <Database aria-hidden className="icon-size-300 mt-100 shrink-0" />
      <div className="flex flex-col gap-100">
        <span className="text-400 font-semibold">No DQ runs recorded yet</span>
        <span className="text-300">
          The DQ store is connected: {dimensions.length} dimension{dimensions.length === 1 ? '' : 's'},{' '}
          {rules.length} active rule{rules.length === 1 ? '' : 's'} and{' '}
          {sources.filter((s) => s.isActive).length} active source table
          {sources.filter((s) => s.isActive).length === 1 ? '' : 's'} are registered. Scores appear here after
          the first run writes to <code className="font-monospace">dq.dq_table_summary</code>.
        </span>
      </div>
    </div>
  );
}

function Body({ data }: { data: DqSummaryData }) {
  const derived = useMemo(() => {
    const sources = dataOr(data.sources, []);
    const summaries = dataOr(data.summaries, []);
    const runs = dataOr(data.runs, []);
    const statuses = buildTableStatuses(sources, summaries, runs);
    const activeIds = new Set(statuses.map((s) => s.source.tableId));
    return {
      sources,
      runs,
      summaries,
      statuses,
      headline: buildHeadline(statuses),
      trend: buildTrend(summaries, activeIds, TREND_DAYS),
      activity: data.runs.status === 'ready' ? buildRunActivity(runs, 24) : null,
      coverage: buildDimensionCoverage(
        dataOr(data.dimensions, []),
        dataOr(data.rules, []),
        data.failures.status === 'ready' ? data.failures.data : null
      ),
    };
  }, [data]);

  const coreError =
    data.sources.status === 'error'
      ? data.sources.message
      : data.summaries.status === 'error'
        ? data.summaries.message
        : null;
  const noRuns = !coreError && derived.summaries.length === 0;

  return (
    <div className="flex flex-col gap-600">
      {coreError && <SectionError message={coreError} />}
      {noRuns && <NoRunsBanner data={data} />}

      <KpiStrip headline={derived.headline} activity={derived.activity} />

      <div className="grid grid-cols-1 gap-400 lg:grid-cols-12">
        <Panel
          title="Pass rate trend"
          eyebrow={`Last ${TREND_DAYS} days · daily, all active tables`}
          className="lg:col-span-8"
        >
          {data.summaries.status === 'error' ? (
            <SectionError message={data.summaries.message} />
          ) : derived.trend.length === 0 ? (
            <EmptyNote>No runs in the last {TREND_DAYS} days.</EmptyNote>
          ) : (
            <TrendChart points={derived.trend} />
          )}
        </Panel>

        <Panel title="Quality dimensions" eyebrow="Active rules" className="lg:col-span-4">
          {data.dimensions.status === 'error' ? (
            <SectionError message={data.dimensions.message} />
          ) : derived.coverage.length === 0 ? (
            <EmptyNote>No dimensions are configured.</EmptyNote>
          ) : (
            <>
              {data.rules.status === 'error' && <SectionError message={data.rules.message} />}
              <DimensionList coverage={derived.coverage} failureWindowDays={FAILURE_WINDOW_DAYS} />
            </>
          )}
        </Panel>

        <Panel
          title="Source tables"
          eyebrow="Latest run vs pass threshold · worst first"
          className="lg:col-span-8"
        >
          {data.sources.status === 'error' ? (
            <SectionError message={data.sources.message} />
          ) : derived.statuses.length === 0 ? (
            <EmptyNote>
              No active tables are registered in <code className="font-monospace">dq.dq_source_table</code>.
            </EmptyNote>
          ) : (
            <TableHealthList statuses={derived.statuses} />
          )}
        </Panel>

        <Panel title="Recent runs" eyebrow="dq.dq_run" className="lg:col-span-4">
          {data.runs.status === 'error' ? (
            <SectionError message={data.runs.message} />
          ) : (
            <RecentRuns runs={derived.runs} sources={derived.sources} />
          )}
        </Panel>
      </div>
    </div>
  );
}

/** Home page: data quality summary across every registered source table. */
export function DqHome() {
  const { state, reload, refreshing } = useDqSummary();

  const lastEvaluated = useMemo(() => {
    if (state.status !== 'ready') return undefined;
    const summaries = dataOr(state.data.summaries, []);
    return summaries.reduce<Date | null>(
      (max, s) => (!max || s.summaryTs > max ? s.summaryTs : max),
      null
    );
  }, [state]);

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-600 px-400 py-600 sm:px-600 lg:px-800">
        <Header lastEvaluated={lastEvaluated} onRefresh={reload} refreshing={refreshing} />
        {state.status === 'loading' && <LoadingBody />}
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
        {state.status === 'ready' && <Body data={state.data} />}
      </main>
    </div>
  );
}
