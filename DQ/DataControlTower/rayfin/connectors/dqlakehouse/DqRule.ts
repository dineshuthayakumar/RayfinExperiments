import { entity, boolean, date, decimal, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_rule; generated as a keyless entity.
// No FK metadata available for dq_rule; relationships omitted.
@entity()
export class DqRule extends Source({ schema: 'dq', table: 'dq_rule', primaryKey: [] }) {
  @int({ column: 'rule_id' }) ruleId!: number;
  @int({ column: 'table_id' }) tableId!: number;
  @int({ column: 'dimension_id' }) dimensionId!: number;
  @text({ column: 'rule_name', max: 8000 }) ruleName!: string;
  @text({ optional: true, column: 'column_name', max: 8000 }) columnName?: string;
  @text({ column: 'rule_expression', max: 8000 }) ruleExpression!: string;
  @decimal({ precision: 9, scale: 4 }) weight!: number;
  @text({ max: 8000 }) severity!: string;
  @boolean({ column: 'is_critical' }) isCritical!: boolean;
  @int({ column: 'rule_version' }) ruleVersion!: number;
  @date({ column: 'effective_from' }) effectiveFrom!: Date;
  @date({ optional: true, column: 'effective_to' }) effectiveTo?: Date;
  @boolean({ column: 'is_active' }) isActive!: boolean;
}
