import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';

import { useProducts, type ProductRecord } from '@/hooks/use-products';
import { cn } from '@/lib/utils';

const TOP_PRODUCT_COUNT = 5;

const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = new Intl.NumberFormat('en-US');

const formatPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const formatTime = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });

type StockLevel = 'in-stock' | 'low' | 'out';

function stockLevel(product: ProductRecord): StockLevel {
  if (product.stockQuantity <= 0) return 'out';
  if (product.stockQuantity <= product.reorderLevel) return 'low';
  return 'in-stock';
}

const stockLevelLabel: Record<StockLevel, string> = {
  'in-stock': 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
};

const stockLevelTone: Record<StockLevel, string> = {
  'in-stock': 'text-emerald-600',
  low: 'text-amber-600',
  out: 'text-muted-foreground',
};

function inventoryValue(product: ProductRecord) {
  return product.price * Math.max(product.stockQuantity, 0);
}

function share(part: number, total: number) {
  return total > 0 ? part / total : 0;
}

function summarize(products: ProductRecord[]) {
  const total = products.length;
  const active = products.filter((p) => p.isActive).length;
  const levels = { 'in-stock': 0, low: 0, out: 0 } satisfies Record<StockLevel, number>;
  let units = 0;
  let value = 0;
  let priceSum = 0;

  for (const product of products) {
    levels[stockLevel(product)] += 1;
    units += Math.max(product.stockQuantity, 0);
    value += inventoryValue(product);
    priceSum += product.price;
  }

  const stocked = levels['in-stock'] + levels.low;
  const topByValue = products
    .filter((p) => inventoryValue(p) > 0)
    .sort((a, b) => inventoryValue(b) - inventoryValue(a) || a.name.localeCompare(b.name))
    .slice(0, TOP_PRODUCT_COUNT);

  return {
    total,
    active,
    levels,
    units,
    value,
    topByValue,
    cards: [
      {
        label: 'Products',
        value: formatNumber.format(total),
        detail: `${formatNumber.format(active)} active`,
        tone: 'text-sky-600',
      },
      {
        label: 'Active rate',
        value: formatPercent.format(share(active, total)),
        detail: `${formatNumber.format(total - active)} inactive`,
        tone: 'text-violet-600',
      },
      {
        label: 'In stock',
        value: formatNumber.format(stocked),
        detail: `${formatNumber.format(units)} units on hand`,
        tone: 'text-emerald-600',
      },
      {
        label: 'Inventory value',
        value: formatCurrency.format(value),
        detail: `avg price ${formatCurrency.format(total > 0 ? priceSum / total : 0)}`,
        tone: 'text-amber-600',
      },
    ],
  };
}

export function ProductDashboard() {
  const { state, reload } = useProducts();
  const products = useMemo(() => (state.status === 'ready' ? state.products : []), [state]);
  const summary = useMemo(() => summarize(products), [products]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  }, [products, search]);

  const isLoading = state.status === 'loading';
  const maxTopValue = summary.topByValue[0] ? inventoryValue(summary.topByValue[0]) : 0;

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Product analytics
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Product catalog overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <span
                className={cn(
                  'inline-flex h-2.5 w-2.5 rounded-full',
                  state.status === 'ready' && 'bg-emerald-500',
                  state.status === 'loading' && 'animate-pulse bg-amber-500',
                  state.status === 'error' && 'bg-red-500'
                )}
                aria-hidden="true"
              />
              {state.status === 'ready'
                ? `ProductLakehouse · updated ${formatTime.format(state.loadedAt)}`
                : state.status === 'loading'
                  ? 'Connecting to ProductLakehouse…'
                  : 'ProductLakehouse unavailable'}
            </div>
            <button
              type="button"
              onClick={reload}
              disabled={isLoading}
              aria-label="Refresh products"
              className="rounded-full border border-border bg-secondary p-2 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden="true" />
            </button>
          </div>
        </header>

        {state.status === 'error' ? (
          <section
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center shadow-sm"
          >
            <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Couldn't load products</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{state.message}</p>
            </div>
            <button
              type="button"
              onClick={reload}
              className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <section aria-label="Key product metrics" className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summary.cards.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-3 text-sm text-muted-foreground">{item.label}</div>
                  {isLoading ? (
                    <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
                  ) : (
                    <div className="flex items-end justify-between gap-3">
                      <div className="text-3xl font-semibold tracking-tight text-foreground">
                        {item.value}
                      </div>
                      <span className={`text-sm font-medium ${item.tone}`}>{item.detail}</span>
                    </div>
                  )}
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm text-muted-foreground">Top products</p>
                  <h2 className="text-xl font-semibold text-foreground">Inventory value by product</h2>
                </div>

                {isLoading ? (
                  <SkeletonRows count={TOP_PRODUCT_COUNT} />
                ) : summary.topByValue.length === 0 ? (
                  <EmptyMessage>No products currently hold stock.</EmptyMessage>
                ) : (
                  <div className="space-y-4">
                    {summary.topByValue.map((product) => (
                      <div key={product.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-muted-foreground">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {formatCurrency.format(inventoryValue(product))}
                            </p>
                            <p className="text-muted-foreground">
                              {formatNumber.format(product.stockQuantity)} ×{' '}
                              {formatCurrency.format(product.price)}
                            </p>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                            style={{
                              width: `${share(inventoryValue(product), maxTopValue) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-2 text-sm text-muted-foreground">Inventory mix</p>
                <h2 className="mb-5 text-xl font-semibold text-foreground">Stock health</h2>

                {isLoading ? (
                  <SkeletonRows count={3} />
                ) : summary.total === 0 ? (
                  <EmptyMessage>No products found.</EmptyMessage>
                ) : (
                  <div className="space-y-4">
                    {(
                      [
                        { level: 'in-stock', color: 'bg-emerald-500' },
                        { level: 'low', color: 'bg-amber-500' },
                        { level: 'out', color: 'bg-slate-500' },
                      ] as const
                    ).map(({ level, color }) => {
                      const count = summary.levels[level];
                      const percent = share(count, summary.total);
                      return (
                        <div key={level}>
                          <div className="mb-1 flex items-center justify-between text-sm text-foreground">
                            <span>{stockLevelLabel[level]}</span>
                            <span className="font-medium">
                              {formatNumber.format(count)}{' '}
                              <span className="text-muted-foreground">
                                ({formatPercent.format(percent)})
                              </span>
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${color}`}
                              style={{ width: `${percent * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </aside>
            </section>

            <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Product detail</p>
                  <h2 className="text-xl font-semibold text-foreground">Catalog</h2>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative">
                    <span className="sr-only">Search products</span>
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or SKU"
                      disabled={isLoading}
                      className="w-56 rounded-full border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                    />
                  </label>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {isLoading
                      ? 'Loading…'
                      : `${formatNumber.format(filtered.length)} of ${formatNumber.format(summary.total)}`}
                  </span>
                </div>
              </div>

              <div className="max-h-[32rem] overflow-auto rounded-xl border border-border">
                <table className="min-w-full divide-y divide-border text-left text-sm">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Stock</th>
                      <th className="px-4 py-3 text-right font-medium">Reorder level</th>
                      <th className="px-4 py-3 font-medium">Stock status</th>
                      <th className="px-4 py-3 font-medium">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-3">
                          <SkeletonRows count={4} />
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          {summary.total === 0 ? 'No products found.' : 'No products match your search.'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((product) => {
                        const level = stockLevel(product);
                        return (
                          <tr key={product.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
                            <td className="px-4 py-3 text-right text-foreground">
                              {formatCurrency.format(product.price)}
                            </td>
                            <td className="px-4 py-3 text-right text-foreground">
                              {formatNumber.format(product.stockQuantity)}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {formatNumber.format(product.reorderLevel)}
                            </td>
                            <td className={cn('px-4 py-3 font-medium', stockLevelTone[level])}>
                              {stockLevelLabel[level]}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {product.isActive ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
