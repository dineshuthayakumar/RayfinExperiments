import { entity, date, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_run; generated as a keyless entity.
// No FK metadata available for dq_run; relationships omitted.
@entity()
export class DqRun extends Source({ schema: 'dq', table: 'dq_run', primaryKey: [] }) {
  @text({ column: 'run_id', max: 8000 }) runId!: string;
  @int({ column: 'table_id' }) tableId!: number;
  @text({ optional: true, column: 'pipeline_name', max: 8000 }) pipelineName?: string;
  @text({ optional: true, column: 'pipeline_run_id', max: 8000 }) pipelineRunId?: string;
  @date({ column: 'run_start_ts' }) runStartTs!: Date;
  @date({ optional: true, column: 'run_end_ts' }) runEndTs?: Date;
  @text({ column: 'run_status', max: 8000 }) runStatus!: string;
  @int({ optional: true, column: 'records_evaluated' }) recordsEvaluated?: number;
}
