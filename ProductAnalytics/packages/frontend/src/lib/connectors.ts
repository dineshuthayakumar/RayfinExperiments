// #region rayfin:app-owned — copied verbatim by the Rayfin CLI; edit freely.
//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import type {
  ConnectorConfig,
  ConnectorsRuntime,
} from '@microsoft/rayfin-connectors';
// #endregion rayfin:app-owned

import {
  connectorConfig as productlakehouseConfig,
  type ProductlakehouseSchema,
} from '../../../../rayfin/connectors/productlakehouse/schema';

export type AppConnectorsSchema = {
  productlakehouse: ProductlakehouseSchema;
};

export const connectorConfigs: Record<string, ConnectorConfig> = {
  productlakehouse: productlakehouseConfig,
};

// Category A (GraphQL-backed) connectors need no runtime entry.
export const connectorRuntimes: ConnectorsRuntime = {};
