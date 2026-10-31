import type { GraphQLBackedConnector } from '@microsoft/rayfin-connector-fabric-graphql';
import type { ConnectorConfig } from '@microsoft/rayfin-connectors';

import { Product } from './Product.js';

export { Product } from './Product.js';

// `as const satisfies` (not `: ConnectorConfig`) so the connector and operations
// literals survive — the marker reads them for the CRUD verbs and the dialect.
export const connectorConfig = {
  connector: 'fabric-sqlanalytics',
  operations: ['read'],
  entities: { Product },
} as const satisfies ConnectorConfig;

export type ProductlakehouseSchema = GraphQLBackedConnector<
  { Product: typeof Product },
  typeof connectorConfig
>;
