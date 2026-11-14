import { entity, boolean, date, decimal, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_record_score; generated as a keyless entity.
// No FK metadata available for dq_record_score; relationships omitted.
@entity()
export class DqRecordScore extends Source({ schema: 'dq', table: 'dq_record_score', primaryKey: [] }) {
  @text({ column: 'record_score_id', max: 8000 }) recordScoreId!: string;
  @text({ column: 'run_id', max: 8000 }) runId!: string;
  @int({ column: 'table_id' }) tableId!: number;
  @text({ column: 'record_key', max: 8000 }) recordKey!: string;
  @text({ column: 'record_key_hash', max: 8000 }) recordKeyHash!: string;
  @decimal({ column: 'dq_score', precision: 5, scale: 2 }) dqScore!: number;
  @boolean({ column: 'dq_status' }) dqStatus!: boolean;
  @int({ column: 'rules_evaluated' }) rulesEvaluated!: number;
  @int({ column: 'rules_failed' }) rulesFailed!: number;
  @boolean({ column: 'critical_failure' }) criticalFailure!: boolean;
  @boolean({ column: 'is_current' }) isCurrent!: boolean;
  @date({ column: 'evaluation_date' }) evaluationDate!: Date;
  @date({ column: 'evaluated_ts' }) evaluatedTs!: Date;
}
