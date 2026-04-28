'use client';

import { useUI } from '@react-zero-ui/core';

type Theme = 'light' | 'dark';
type Accent = 'blue' | 'rose' | 'emerald' | 'amber';

const accents: { value: Accent; swatch: string; ring: string }[] = [
  {
    value: 'blue',
    swatch: 'bg-blue-500',
    ring: 'demo-accent-blue:border-fd-foreground demo-accent-blue:scale-110',
  },
  {
    value: 'rose',
    swatch: 'bg-rose-500',
    ring: 'demo-accent-rose:border-fd-foreground demo-accent-rose:scale-110',
  },
  {
    value: 'emerald',
    swatch: 'bg-emerald-500',
    ring: 'demo-accent-emerald:border-fd-foreground demo-accent-emerald:scale-110',
  },
  {
    value: 'amber',
    swatch: 'bg-amber-500',
    ring: 'demo-accent-amber:border-fd-foreground demo-accent-amber:scale-110',
  },
];

export function LandingDemo() {
  const [, setTheme] = useUI<Theme>('demo-theme', 'light');
  const [, setAccent] = useUI<Accent>('demo-accent', 'blue');

  return (
    <div className="border-fd-border bg-fd-card rounded-xl border p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-fd-muted-foreground">Theme</span>
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            className="demo-theme-light:bg-white demo-theme-light:text-slate-900 demo-theme-dark:bg-slate-900 demo-theme-dark:text-white border-fd-border hover:border-fd-primary rounded-md border px-3 py-1 font-medium transition-colors">
            <span className="demo-theme-light:inline demo-theme-dark:hidden">Light</span>
            <span className="demo-theme-dark:inline demo-theme-light:hidden">Dark</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-fd-muted-foreground">Accent</span>
          <div className="flex gap-1.5">
            {accents.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-label={`Set accent ${c.value}`}
                onClick={() => setAccent(c.value)}
                className={`h-6 w-6 rounded-full border-2 border-transparent transition-all ${c.swatch} ${c.ring}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="demo-theme-light:bg-slate-50 demo-theme-light:text-slate-900 demo-theme-dark:bg-slate-950 demo-theme-dark:text-slate-100 demo-accent-blue:ring-blue-500 demo-accent-rose:ring-rose-500 demo-accent-emerald:ring-emerald-500 demo-accent-amber:ring-amber-500 space-y-3 rounded-lg p-6 ring-2 transition-colors">
        <p className="demo-accent-blue:text-blue-500 demo-accent-rose:text-rose-500 demo-accent-emerald:text-emerald-500 demo-accent-amber:text-amber-500 text-xs font-semibold tracking-wide uppercase">
          Live preview
        </p>
        <h3 className="text-lg font-semibold">Not a single React re-render.</h3>
        <p className="text-sm opacity-80">
          Every click above flips <code className="font-mono text-xs">data-demo-theme</code> and{' '}
          <code className="font-mono text-xs">data-demo-accent</code> on <code className="font-mono text-xs">&lt;body&gt;</code>. Tailwind
          variants react instantly — no component state, no re-renders, no context provider.
        </p>
        <button
          type="button"
          className="demo-accent-blue:bg-blue-500 demo-accent-rose:bg-rose-500 demo-accent-emerald:bg-emerald-500 demo-accent-amber:bg-amber-500 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
          Accent-colored button
        </button>
      </div>
    </div>
  );
}
