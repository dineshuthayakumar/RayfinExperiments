import { entity, boolean, date, decimal, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_source_table; generated as a keyless entity.
// No FK metadata available for dq_source_table; relationships omitted.
@entity()
export class DqSourceTable extends Source({ schema: 'dq', table: 'dq_source_table', primaryKey: [] }) {
  @int({ column: 'table_id' }) tableId!: number;
  @text({ column: 'workspace_name', max: 8000 }) workspaceName!: string;
  @text({ column: 'lakehouse_name', max: 8000 }) lakehouseName!: string;
  @text({ column: 'schema_name', max: 8000 }) schemaName!: string;
  @text({ column: 'table_name', max: 8000 }) tableName!: string;
  @text({ max: 8000 }) layer!: string;
  @text({ column: 'business_key_columns', max: 8000 }) businessKeyColumns!: string;
  @decimal({ column: 'pass_threshold', precision: 5, scale: 2 }) passThreshold!: number;
  @boolean({ column: 'is_active' }) isActive!: boolean;
  @date({ column: 'created_ts' }) createdTs!: Date;
}
