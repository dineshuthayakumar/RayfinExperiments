//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

import { getRayfinClient } from '@/lib/rayfin-client';

export type ProductRecord = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
};

export type ProductsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; products: ProductRecord[]; loadedAt: Date };

const PAGE_SIZE = 500;
const MAX_PAGES = 50;

/** Reads every row of dbo.Product from the ProductLakehouse SQL endpoint. */
async function fetchAllProducts(): Promise<ProductRecord[]> {
  const client = await getRayfinClient();
  const { Product } = client.connectors.productlakehouse;
  const products: ProductRecord[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    let query = Product.select([
      'id',
      'name',
      'sku',
      'price',
      'stockQuantity',
      'reorderLevel',
      'isActive',
    ])
      .orderBy({ name: 'asc' })
      .first(PAGE_SIZE);
    if (cursor) query = query.after(cursor);

    const result = await query.executePaginated();
    for (const row of result.items) {
      products.push({
        id: row.id ?? row.sku ?? row.name ?? '',
        name: row.name ?? 'Unnamed product',
        sku: row.sku ?? '—',
        price: Number(row.price ?? 0),
        stockQuantity: Number(row.stockQuantity ?? 0),
        reorderLevel: Number(row.reorderLevel ?? 0),
        isActive: row.isActive ?? false,
      });
    }

    if (!result.hasNextPage || !result.endCursor) return products;
    cursor = result.endCursor;
  }

  throw new Error(`Product table exceeds ${PAGE_SIZE * MAX_PAGES} rows.`);
}

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to load products from ProductLakehouse.';
}

export function useProducts() {
  const [state, setState] = useState<ProductsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchAllProducts().then(
      (products) => {
        if (!cancelled) setState({ status: 'ready', products, loadedAt: new Date() });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: toMessage(error) });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, reload };
}
