import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DqRuleView } from '@/hooks/use-dq-rules';

const rule = (over: Partial<DqRuleView>): DqRuleView => ({
  ruleId: 1,
  ruleName: 'Product ID not null',
  tableId: 10,
  tableLabel: 'dbo.product',
  layer: 'silver',
  dimensionId: 1,
  dimensionName: 'Completeness',
  columnName: 'product_id',
  ruleExpression: 'product_id IS NOT NULL',
  weight: 1,
  severity: 'High',
  isCritical: true,
  ruleVersion: 1,
  effectiveFrom: new Date('2026-01-01'),
  effectiveTo: null,
  isActive: true,
  ...over,
});

vi.mock('@/hooks/use-dq-rules', () => ({
  useDqRules: () => ({
    state: {
      status: 'ready',
      loadedAt: new Date(),
      rules: [
        rule({}),
        rule({ ruleId: 2, ruleName: 'Price positive', dimensionName: 'Validity', columnName: 'list_price', ruleExpression: 'list_price > 0', isCritical: false, severity: 'Medium' }),
        rule({ ruleId: 3, ruleName: 'Retired rule', isActive: false }),
      ],
    },
    reload: () => {},
    refreshing: false,
  }),
}));

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('lists active rules by default', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('heading', { name: 'DQ rules' })).toBeVisible();
    expect(screen.getByText('Product ID not null')).toBeVisible();
    expect(screen.getByText('Price positive')).toBeVisible();
    expect(screen.queryByText('Retired rule')).toBeNull();
    expect(screen.getByText('Showing 2 of 3 rules')).toBeVisible();
  });

  it('filters by search text and expands rule detail', () => {
    render(<SettingsPage />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'price' } });
    expect(screen.queryByText('Product ID not null')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show details for Price positive' }));
    expect(screen.getByText('list_price > 0')).toBeVisible();
  });
});
