//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import App from '@/App';

const executePaginated = vi.fn();

vi.mock('@/lib/rayfin-client', () => {
  const builder = {
    orderBy: () => builder,
    first: () => builder,
    after: () => builder,
    executePaginated: () => executePaginated(),
  };
  return {
    getRayfinClient: async () => ({
      connectors: { productlakehouse: { Product: { select: () => builder } } },
    }),
  };
});

const rows = [
  { id: '1', name: 'LZ-6', sku: 'LZ-6', price: 1, stockQuantity: 10, reorderLevel: 1, isActive: true },
  { id: '2', name: 'WGZ16B-1', sku: 'WGZ16B-1', price: 0.01, stockQuantity: 0, reorderLevel: 0, isActive: true },
  { id: '3', name: 'G2L16A-1', sku: 'G2L16A-1', price: 0.01, stockQuantity: 0, reorderLevel: 0, isActive: false },
];

describe('App', () => {
  beforeEach(() => {
    executePaginated.mockReset();
  });

  it('renders Product rows from ProductLakehouse', async () => {
    executePaginated.mockResolvedValue({ items: rows, hasNextPage: false });
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Product catalog overview' })).toBeVisible();
    expect(screen.getByText('Connecting to ProductLakehouse…')).toBeVisible();

    const metrics = await screen.findByRole('region', { name: 'Key product metrics' });
    expect(await within(metrics).findByText('3')).toBeVisible();
    expect(within(metrics).getByText('2 active')).toBeVisible();
    expect(within(metrics).getByText('$10.00')).toBeVisible();
    expect(screen.getAllByText('G2L16A-1').length).toBeGreaterThan(0);
  });

  it('surfaces a load failure with a retry action', async () => {
    executePaginated.mockRejectedValue(new Error('Forbidden'));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
