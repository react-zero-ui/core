'use client';

import { useEffect, useRef, useState } from 'react';
import { useUI } from '@react-zero-ui/core';
import { categories, fetchWithDelay, type Category, type Product } from './_data';

type CategoryFilter = Category | 'all';

export function RealWorldDemo() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  return (
    <div className="space-y-6">
      <SearchControls query={query} setQuery={setQuery} category={category} setCategory={setCategory} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ReactPane query={query} category={category} />
        <ZeroUiPane query={query} category={category} />
      </div>
      <p className="text-fd-muted-foreground text-center text-sm">
        Type in the search or change the filter. Watch the render counters — both panes update on keystroke (the search input drives both),
        but only the React pane re-renders during the loading transition.
      </p>
    </div>
  );
}

function SearchControls({
  query,
  setQuery,
  category,
  setCategory,
}: {
  query: string;
  setQuery: (v: string) => void;
  category: CategoryFilter;
  setCategory: (v: CategoryFilter) => void;
}) {
  return (
    <div className="border-fd-border bg-fd-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <input
        type="search"
        placeholder="Search products…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-fd-border bg-fd-background focus:border-fd-primary w-full rounded-md border px-3 py-2 text-sm outline-none sm:max-w-xs"
      />
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = c.value === category;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={[
                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                active ? 'bg-fd-primary text-fd-primary-foreground border-fd-primary' : 'border-fd-border hover:bg-fd-accent',
              ].join(' ')}>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReactPane({ query, category }: { query: string; category: CategoryFilter }) {
  const [data, setData] = useState<Product[]>(() => []);
  const [loading, setLoading] = useState(true);
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWithDelay(query, category).then((results) => {
      if (cancelled) return;
      setData(results);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [query, category]);

  return (
    <Pane title="React useState" subtitle="Loading state lives in React — every transition causes a re-render." renderCount={renderCount.current}>
      {loading ? <SkeletonList /> : <ProductList products={data} />}
    </Pane>
  );
}

function ZeroUiPane({ query, category }: { query: string; category: CategoryFilter }) {
  const [data, setData] = useState<Product[]>(() => []);
  const [, setStatus] = useUI<'idle' | 'loading' | 'success'>('demo-search-status', 'idle');
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchWithDelay(query, category).then((results) => {
      if (cancelled) return;
      setData(results);
      setStatus('success');
    });
    return () => {
      cancelled = true;
    };
  }, [query, category, setStatus]);

  return (
    <Pane
      title="Zero-UI hybrid"
      subtitle="Loading flips data-demo-search-status on <body>. Data uses useState. One render per fetch."
      renderCount={renderCount.current}>
      <div className="demo-search-status-loading:block hidden">
        <SkeletonList />
      </div>
      <div className="demo-search-status-loading:hidden">
        <ProductList products={data} />
      </div>
    </Pane>
  );
}

function Pane({ title, subtitle, renderCount, children }: { title: string; subtitle: string; renderCount: number; children: React.ReactNode }) {
  return (
    <div className="border-fd-border bg-fd-card flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-fd-muted-foreground mt-1 text-xs">{subtitle}</p>
        </div>
        <div
          className="border-fd-primary/30 bg-fd-primary/10 text-fd-primary inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs"
          suppressHydrationWarning>
          renders: <span className="font-semibold">{renderCount}</span>
        </div>
      </div>
      <div className="min-h-[18rem]">{children}</div>
    </div>
  );
}

function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-fd-muted-foreground py-8 text-center text-sm">No products match.</p>;
  }
  return (
    <ul className="divide-fd-border divide-y">
      {products.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-fd-muted-foreground text-xs capitalize">{p.category}</div>
          </div>
          <div className="font-mono text-sm tabular-nums">${p.price}</div>
        </li>
      ))}
    </ul>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-2">
          <div className="flex-1 space-y-1.5">
            <div className="bg-fd-accent h-3.5 w-2/3 animate-pulse rounded" />
            <div className="bg-fd-accent h-2.5 w-1/4 animate-pulse rounded" />
          </div>
          <div className="bg-fd-accent h-3.5 w-10 animate-pulse rounded" />
        </li>
      ))}
    </ul>
  );
}
