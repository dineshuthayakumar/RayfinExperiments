import { entity, date, decimal, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_table_summary; generated as a keyless entity.
// No FK metadata available for dq_table_summary; relationships omitted.
@entity()
export class DqTableSummary extends Source({ schema: 'dq', table: 'dq_table_summary', primaryKey: [] }) {
  @text({ column: 'run_id', max: 8000 }) runId!: string;
  @int({ column: 'table_id' }) tableId!: number;
  @int({ column: 'total_records' }) totalRecords!: number;
  @int({ column: 'passed_records' }) passedRecords!: number;
  @int({ column: 'failed_records' }) failedRecords!: number;
  @decimal({ optional: true, column: 'avg_dq_score', precision: 5, scale: 2 }) avgDqScore?: number;
  @decimal({ optional: true, column: 'pass_rate_pct', precision: 5, scale: 2 }) passRatePct?: number;
  @date({ column: 'summary_ts' }) summaryTs!: Date;
}
