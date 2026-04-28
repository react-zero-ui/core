'use client';

import { useRef } from 'react';
import { useUI } from '@react-zero-ui/core';

export function ZeroState() {
  const [, setTheme] = useUI<'light' | 'dark'>('perf-theme', 'light');
  const [, setAccent] = useUI<'violet' | 'emerald' | 'amber'>('perf-accent', 'violet');
  const [, setMenuOpen] = useUI<'true' | 'false'>('perf-menu-open', 'false');
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div className="perf-theme-light:bg-gray-100 perf-theme-dark:bg-gray-900 flex h-full w-full flex-col justify-between space-y-4 py-8 **:transition-all **:duration-300">
      <Header renderCount={renderCount.current} />
      <ThemeSwitcher setTheme={setTheme} />
      <AccentPicker setAccent={setAccent} />
      <InteractiveCard toggleMenu={() => setMenuOpen((prev) => (prev === 'true' ? 'false' : 'true'))} />
      <StateDisplay />
    </div>
  );
}

function Header({ renderCount }: { renderCount: number }) {
  return (
    <div className="space-y-2 text-center">
      <div
        className="perf-theme-light:border-violet-300 perf-theme-light:bg-violet-100 perf-theme-light:text-violet-700 perf-theme-dark:border-violet-500/40 perf-theme-dark:bg-violet-500/15 perf-theme-dark:text-violet-300 mx-auto inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs"
        suppressHydrationWarning>
        renders: <span className="font-semibold">{renderCount}</span>
      </div>
      <h1 className="perf-theme-light:text-gray-900 perf-theme-dark:text-white text-3xl font-bold">Zero UI</h1>
      <p className="perf-theme-light:text-gray-600 perf-theme-dark:text-gray-400">
        Reactive state without re-rendering.
        <br />
        <span className="text-sm">
          <span className="perf-theme-light:text-gray-900 perf-theme-dark:text-white font-bold">Zero</span> re-renders,{' '}
          <span className="perf-theme-light:text-gray-900 perf-theme-dark:text-white font-bold">Reactive</span> &{' '}
          <span className="perf-theme-light:text-gray-900 perf-theme-dark:text-white font-bold">Global</span> state.
        </span>
      </p>
    </div>
  );
}

function ThemeSwitcher({ setTheme }: { setTheme: (t: 'light' | 'dark') => void }) {
  return (
    <div className="flex justify-center gap-2">
      <button
        aria-label="Set light theme"
        onClick={() => setTheme('light')}
        className="perf-theme-light:bg-gray-900 perf-theme-light:text-white perf-theme-dark:bg-gray-700 perf-theme-dark:text-gray-200 rounded-full border border-gray-400 px-6 py-3 font-medium hover:scale-105">
        ☀️ Light
      </button>
      <button
        aria-label="Set dark theme"
        onClick={() => setTheme('dark')}
        className="perf-theme-dark:bg-white perf-theme-dark:text-gray-900 perf-theme-light:bg-gray-200 perf-theme-light:text-gray-600 rounded-full border border-gray-400 px-6 py-3 font-medium hover:scale-105">
        🌙 Dark
      </button>
    </div>
  );
}

function AccentPicker({ setAccent }: { setAccent: (a: 'violet' | 'emerald' | 'amber') => void }) {
  return (
    <div className="space-y-4 pb-2">
      <h2 className="perf-theme-light:text-gray-800 perf-theme-dark:text-gray-200 text-center text-lg font-semibold">Choose Accent</h2>
      <div className="flex justify-center gap-3">
        <button
          aria-label="Set violet accent"
          onClick={() => setAccent('violet')}
          className="perf-accent-violet:ring-6 perf-accent-violet:ring-violet-200 perf-accent-violet:bg-violet-500 perf-theme-dark:perf-accent-violet:ring-violet-900 h-12 w-12 rounded-full bg-violet-500/50 ring-violet-900 hover:scale-110"
        />
        <button
          aria-label="Set emerald accent"
          onClick={() => setAccent('emerald')}
          className="perf-accent-emerald:ring-6 perf-accent-emerald:ring-emerald-200 perf-theme-dark:perf-accent-emerald:ring-emerald-900 perf-accent-emerald:bg-emerald-500 h-12 w-12 rounded-full bg-emerald-500/50 hover:scale-110"
        />
        <button
          aria-label="Set amber accent"
          onClick={() => setAccent('amber')}
          className="perf-accent-amber:ring-6 perf-accent-amber:ring-amber-200 perf-theme-dark:perf-accent-amber:ring-amber-900 perf-accent-amber:bg-amber-500 h-12 w-12 rounded-full bg-amber-500/50 hover:scale-110"
        />
      </div>
    </div>
  );
}

function InteractiveCard({ toggleMenu }: { toggleMenu: () => void }) {
  return (
    <div className="perf-theme-light:bg-gray-50 perf-theme-light:shadow-gray-200 perf-theme-dark:bg-gray-700 perf-theme-dark:shadow-black/50 relative mx-auto max-w-md overflow-hidden rounded-2xl border border-gray-200 shadow-lg transition-all duration-0!">
      <div className="space-y-4 p-6">
        <h3 className="perf-theme-light:text-gray-900 perf-theme-dark:text-white text-xl font-semibold">Open Menu Demo</h3>
        <button
          aria-label="Toggle menu"
          onClick={toggleMenu}
          className="perf-accent-violet:bg-violet-500 perf-accent-emerald:bg-emerald-500 perf-accent-amber:bg-amber-500 w-full rounded-lg py-3 font-medium text-white hover:scale-[1.02]">
          <span className="perf-menu-open-false:hidden">Close Panel</span>
          <span className="perf-menu-open-true:hidden">Open Panel</span>
        </button>
      </div>
      <div className="perf-menu-open-true:max-h-[80px] perf-menu-open-false:max-h-0 overflow-hidden">
        <div className="perf-theme-dark:bg-gray-700 perf-theme-light:bg-white border-t border-gray-200 p-6 transition-all duration-0!">
          <p className="perf-theme-dark:text-gray-300 perf-theme-light:text-gray-600 text-center">✨ This panel slides open without re-rendering!</p>
        </div>
      </div>
    </div>
  );
}

function StateDisplay() {
  return (
    <div className="max-[450px]:hidden">
      <div className="perf-theme-light:text-gray-500 perf-theme-dark:text-gray-400 **:perf-accent-violet:text-violet-500 **:perf-accent-emerald:text-emerald-500 **:perf-accent-amber:text-amber-500 mt-5 flex justify-center gap-4 space-y-1 text-center font-mono text-sm capitalize">
        <div className="flex gap-1 text-nowrap **:text-nowrap">
          theme: <span className="perf-theme-dark:hidden">Light</span>
          <span className="perf-theme-light:hidden">Dark</span>
        </div>
        <div className="flex gap-1 text-nowrap **:text-nowrap">
          accent:
          <span className="perf-accent-violet:block hidden">Violet</span>
          <span className="perf-accent-emerald:block hidden">Emerald</span>
          <span className="perf-accent-amber:block hidden">Amber</span>
        </div>
        <div className="flex gap-1 text-nowrap **:text-nowrap">
          menu:
          <span className="perf-menu-open-true:hidden">Open</span>
          <span className="perf-menu-open-false:hidden">Closed</span>
        </div>
      </div>
    </div>
  );
}
