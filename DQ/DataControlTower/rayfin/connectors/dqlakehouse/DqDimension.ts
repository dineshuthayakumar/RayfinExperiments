import { entity, int, text } from '@microsoft/rayfin-core';
import { Source } from '@microsoft/rayfin-connectors';

// No PK metadata available for dq_dimension; generated as a keyless entity.
// No FK metadata available for dq_dimension; relationships omitted.
@entity()
export class DqDimension extends Source({ schema: 'dq', table: 'dq_dimension', primaryKey: [] }) {
  @int({ column: 'dimension_id' }) dimensionId!: number;
  @text({ column: 'dimension_name', max: 8000 }) dimensionName!: string;
  @text({ optional: true, max: 8000 }) description?: string;
}
