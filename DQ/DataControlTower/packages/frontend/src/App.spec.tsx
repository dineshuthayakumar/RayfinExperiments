//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// The DQ home page reads the live connector; keep it in its loading state here
// so these tests stay focused on the auth boundary.
vi.mock('@/hooks/use-dq-summary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-dq-summary')>();
  return {
    ...actual,
    useDqSummary: () => ({ state: { status: 'loading' }, reload: () => {}, refreshing: true }),
  };
});

import App from '@/App';

describe('App', () => {
  it('renders without throwing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('shows the data quality summary heading while loading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Data quality summary' })
    ).toBeVisible();
    expect(screen.getByLabelText('Loading data quality summary')).toBeVisible();
  });
});
