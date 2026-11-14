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
  connectorConfig as dqlakehouseConfig,
  type DqlakehouseSchema,
} from '../../../../rayfin/connectors/dqlakehouse/schema';

// Builder-owned: the generated marker was removed to wire the dq entities.
// Keep the key `dqlakehouse` identical to `name` in rayfin/rayfin.yml.

export type AppConnectorsSchema = {
  dqlakehouse: DqlakehouseSchema;
};

export const connectorConfigs: Record<string, ConnectorConfig> = {
  dqlakehouse: dqlakehouseConfig,
};

export const connectorRuntimes: ConnectorsRuntime = {};
