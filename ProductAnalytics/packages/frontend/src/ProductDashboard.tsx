type ProductRow = {
  name: string;
  category: string;
  revenue: number;
  units: number;
  yoy: number;
};

const summary = [
  { label: 'Revenue', value: '$4.8M', delta: '+18.4%', tone: 'text-emerald-600' },
  { label: 'Units Sold', value: '128.4K', delta: '+12.1%', tone: 'text-sky-600' },
  { label: 'Gross Margin', value: '42.6%', delta: '+3.2 pts', tone: 'text-violet-600' },
  { label: 'Avg Rating', value: '4.8/5', delta: '+0.3', tone: 'text-amber-600' },
] as const;

const products: ProductRow[] = [
  { name: 'Apex Pro', category: 'Laptops', revenue: 1200000, units: 3200, yoy: 22.5 },
  { name: 'Terra Desk', category: 'Accessories', revenue: 980000, units: 28000, yoy: 17.1 },
  { name: 'Echo Mini', category: 'Audio', revenue: 760000, units: 15500, yoy: 14.8 },
  { name: 'Pulse Watch', category: 'Wearables', revenue: 640000, units: 8900, yoy: 26.4 },
  { name: 'Flow Hub', category: 'Home Office', revenue: 520000, units: 6700, yoy: 11.7 },
];

const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const formatCompact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function ProductDashboard() {
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Product analytics
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Product performance overview
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live semantic model snapshot
          </div>
        </header>

        <section aria-label="Key product metrics" className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-3 text-sm text-muted-foreground">{item.label}</div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-3xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </div>
                <span className={`text-sm font-medium ${item.tone}`}>{item.delta}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Top products</p>
                <h2 className="text-xl font-semibold text-foreground">Revenue by product</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                This quarter
              </button>
            </div>

            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency.format(product.revenue)}</p>
                      <p className="text-emerald-600">+{product.yoy}% YoY</p>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                      style={{ width: `${Math.min((product.revenue / 1200000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-2 text-sm text-muted-foreground">Performance mix</p>
            <h2 className="mb-5 text-xl font-semibold text-foreground">Category outlook</h2>

            <div className="space-y-4">
              {[
                { label: 'Laptops', percent: 38, value: '$1.8M', color: 'bg-sky-500' },
                { label: 'Accessories', percent: 26, value: '$1.2M', color: 'bg-violet-500' },
                { label: 'Audio', percent: 19, value: '$0.9M', color: 'bg-amber-500' },
                { label: 'Wearables', percent: 12, value: '$0.6M', color: 'bg-emerald-500' },
                { label: 'Home Office', percent: 5, value: '$0.3M', color: 'bg-slate-500' },
              ].map((category) => (
                <div key={category.label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-foreground">
                    <span>{category.label}</span>
                    <span className="font-medium">{category.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${category.color}`}
                      style={{ width: `${category.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Product detail</p>
              <h2 className="text-xl font-semibold text-foreground">Catalog performance</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Q4 snapshot
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 font-medium">YoY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {products.map((product) => (
                  <tr key={product.name} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatCurrency.format(product.revenue)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{formatCompact.format(product.units)}</td>
                    <td className="px-4 py-3 text-emerald-600">+{product.yoy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
