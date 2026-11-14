import { entity, boolean, date, decimal, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_rule_result; generated as a keyless entity.
// No FK metadata available for dq_rule_result; relationships omitted.
@entity()
export class DqRuleResult extends Source({ schema: 'dq', table: 'dq_rule_result', primaryKey: [] }) {
  @text({ column: 'run_id', max: 8000 }) runId!: string;
  @int({ column: 'table_id' }) tableId!: number;
  @text({ column: 'record_key_hash', max: 8000 }) recordKeyHash!: string;
  @int({ column: 'rule_id' }) ruleId!: number;
  @boolean({ column: 'is_passed' }) isPassed!: boolean;
  @decimal({ optional: true, column: 'rule_score', precision: 9, scale: 4 }) ruleScore?: number;
  @text({ optional: true, column: 'failed_value', max: 8000 }) failedValue?: string;
  @text({ optional: true, column: 'failure_reason', max: 8000 }) failureReason?: string;
  @date({ column: 'evaluation_date' }) evaluationDate!: Date;
}
