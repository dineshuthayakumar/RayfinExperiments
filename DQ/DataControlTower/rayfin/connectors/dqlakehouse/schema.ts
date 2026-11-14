import type { GraphQLBackedConnector } from '@microsoft/rayfin-connector-fabric-graphql';
import type { ConnectorConfig } from '@microsoft/rayfin-connectors';

import { DqDimension } from './DqDimension.js';
import { DqRecordScore } from './DqRecordScore.js';
import { DqRule } from './DqRule.js';
import { DqRuleResult } from './DqRuleResult.js';
import { DqRun } from './DqRun.js';
import { DqSourceTable } from './DqSourceTable.js';
import { DqTableSummary } from './DqTableSummary.js';

export { DqDimension } from './DqDimension.js';
export { DqRecordScore } from './DqRecordScore.js';
export { DqRule } from './DqRule.js';
export { DqRuleResult } from './DqRuleResult.js';
export { DqRun } from './DqRun.js';
export { DqSourceTable } from './DqSourceTable.js';
export { DqTableSummary } from './DqTableSummary.js';

// `as const satisfies` (not `: ConnectorConfig`) so the connector and operations
// literals survive — the marker reads them for the CRUD verbs and the dialect.
export const connectorConfig = {
  connector: 'fabric-sqlanalytics',
  operations: ['read'],
  entities: { DqDimension, DqRecordScore, DqRule, DqRuleResult, DqRun, DqSourceTable, DqTableSummary },
} as const satisfies ConnectorConfig;

export type DqlakehouseSchema = GraphQLBackedConnector<
  { DqDimension: typeof DqDimension; DqRecordScore: typeof DqRecordScore; DqRule: typeof DqRule; DqRuleResult: typeof DqRuleResult; DqRun: typeof DqRun; DqSourceTable: typeof DqSourceTable; DqTableSummary: typeof DqTableSummary },
  typeof connectorConfig
>;
