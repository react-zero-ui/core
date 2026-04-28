'use client';

import { useRef, useState } from 'react';

type Theme = 'light' | 'dark';
type Accent = 'violet' | 'emerald' | 'amber';

export function ReactState() {
  const [accent, setAccent] = useState<Accent>('violet');
  const [theme, setTheme] = useState<Theme>('light');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div
      className={`flex h-full w-full flex-col justify-between space-y-4 py-8 **:transition-all **:duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Header theme={theme} renderCount={renderCount.current} />
      <ThemeSwitcher theme={theme} setTheme={setTheme} />
      <AccentPicker accent={accent} setAccent={setAccent} theme={theme} />
      <InteractiveCard theme={theme} menuOpen={menuOpen} setMenuOpen={setMenuOpen} accent={accent} />
      <StateDisplay theme={theme} accent={accent} menuOpen={menuOpen} />
    </div>
  );
}

function Header({ theme, renderCount }: { theme: Theme; renderCount: number }) {
  return (
    <div className="space-y-2 text-center">
      <div
        className={`mx-auto inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs ${theme === 'light' ? 'border-violet-300 bg-violet-100 text-violet-700' : 'border-violet-500/40 bg-violet-500/15 text-violet-300'}`}
        suppressHydrationWarning>
        renders: <span className="font-semibold">{renderCount}</span>
      </div>
      <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
        React State <span className="max-[450px]:hidden">Management</span>
      </h1>
      <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
        Reactive state management with React <br />
        <span className="text-xs text-gray-500">Re-renders O(n)</span>
      </p>
    </div>
  );
}

function ThemeSwitcher({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="flex justify-center gap-2">
      <button
        aria-label="Set light theme"
        onClick={() => setTheme('light')}
        className={`rounded-full border border-gray-400 px-6 py-3 font-medium hover:scale-105 ${theme === 'light' ? 'bg-gray-900 text-white' : 'bg-gray-700 text-gray-200'}`}>
        ☀️ Light
      </button>
      <button
        aria-label="Set dark theme"
        onClick={() => setTheme('dark')}
        className={`rounded-full border border-gray-400 px-6 py-3 font-medium hover:scale-105 ${theme === 'dark' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-600'}`}>
        🌙 Dark
      </button>
    </div>
  );
}

function AccentPicker({ accent, setAccent, theme }: { accent: Accent; setAccent: (a: Accent) => void; theme: Theme }) {
  return (
    <div className="space-y-4 pb-2">
      <h2 className={`text-center text-lg font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>Choose Accent</h2>
      <div className="flex justify-center gap-3">
        <button
          aria-label="Set violet accent"
          onClick={() => setAccent('violet')}
          className={`h-12 w-12 rounded-full bg-violet-500 hover:scale-110 ${accent === 'violet' ? 'ring-6 ring-violet-200' : 'bg-violet-500/50 ring-violet-900'} ${theme === 'dark' && 'ring-violet-900'}`}
        />
        <button
          aria-label="Set emerald accent"
          onClick={() => setAccent('emerald')}
          className={`h-12 w-12 rounded-full bg-emerald-500 hover:scale-110 ${accent === 'emerald' ? 'ring-6 ring-emerald-200' : 'bg-emerald-500/50 ring-emerald-900'} ${theme === 'dark' && 'ring-emerald-900'}`}
        />
        <button
          aria-label="Set amber accent"
          onClick={() => setAccent('amber')}
          className={`h-12 w-12 rounded-full bg-amber-500 hover:scale-110 ${accent === 'amber' ? 'ring-6 ring-amber-200' : 'bg-amber-500/50 ring-amber-900'} ${theme === 'dark' && 'ring-amber-900'}`}
        />
      </div>
    </div>
  );
}

function InteractiveCard({ theme, menuOpen, setMenuOpen, accent }: { theme: Theme; menuOpen: boolean; setMenuOpen: (o: boolean) => void; accent: Accent }) {
  return (
    <div
      className={`relative mx-auto max-w-md overflow-hidden rounded-2xl border border-gray-200 shadow-lg transition-all duration-0! ${theme === 'light' ? 'bg-gray-50 shadow-gray-200' : 'bg-gray-700 shadow-black/50'}`}>
      <div className="space-y-4 p-6">
        <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Open Menu Demo</h3>
        <button
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`w-full rounded-lg py-3 font-medium text-white hover:scale-[1.02] ${accent === 'violet' && 'bg-violet-500'} ${accent === 'emerald' && 'bg-emerald-500'} ${accent === 'amber' && 'bg-amber-500'}`}>
          {menuOpen ? 'Close Menu' : 'Open Menu'}
        </button>
      </div>
      <div className={`overflow-hidden ${menuOpen ? 'max-h-[160px]' : 'max-h-0'}`}>
        <div className={`border-t border-gray-200 p-6 transition-all duration-0! ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-center`}>✨ This panel slides open and has to re-render!</p>
        </div>
      </div>
    </div>
  );
}

function StateDisplay({ theme, accent, menuOpen }: { theme: Theme; accent: Accent; menuOpen: boolean }) {
  return (
    <div className="max-[450px]:hidden">
      <div
        className={`mt-5 flex justify-center gap-4 space-y-1 text-center font-mono text-sm capitalize **:text-nowrap ${accent === 'violet' ? 'text-violet-500' : accent === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}`}>
        <div className="flex gap-1">theme: {theme}</div>
        <div className="flex gap-1">accent: {accent}</div>
        <div className="flex gap-1">menu: {menuOpen ? 'Open' : 'Closed'}</div>
      </div>
    </div>
  );
}
