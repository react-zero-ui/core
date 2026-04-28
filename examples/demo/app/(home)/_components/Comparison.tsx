'use client';

import { Atom, Zap } from 'lucide-react';
import { useUI } from '@react-zero-ui/core';
import { ReactState } from './ReactState';
import { ZeroState } from './ZeroState';

export function Comparison() {
  const [, setActive] = useUI<'zero' | 'react'>('perf-active', 'zero');

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="relative flex overflow-hidden rounded-t-lg border border-gray-200 text-white">
        <div className="perf-active-zero:left-0 perf-active-react:left-1/2 perf-active-zero:bg-gradient-to-r perf-active-zero:from-purple-600 perf-active-zero:to-blue-600 perf-active-react:bg-gradient-to-l perf-active-react:from-[#58C4E0] perf-active-react:to-blue-500 absolute bottom-0 left-0 z-0 h-full w-1/2 rounded-t-lg transition-all duration-300" />
        <button
          type="button"
          onClick={() => setActive('zero')}
          className="perf-active-zero:text-white relative z-10 flex flex-1 items-center justify-center gap-2 rounded-tl-lg px-6 py-4 font-semibold text-gray-600 transition-colors duration-300">
          <Zap className="h-4 w-4" />
          Zero UI
        </button>
        <button
          type="button"
          onClick={() => setActive('react')}
          className="perf-active-react:text-white relative z-10 flex flex-1 items-center justify-center gap-2 rounded-tr-lg px-6 py-4 font-semibold text-gray-600 transition-colors duration-300">
          <Atom className="h-4 w-4" />
          React State
        </button>
      </div>

      <div className="h-full w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-200">
        <div className="perf-active-zero:translate-x-0 perf-active-react:translate-x-[-50%] grid h-full w-[200%] grid-cols-2 items-center justify-start transition-transform duration-300">
          <ZeroState />
          <ReactState />
        </div>
      </div>
    </div>
  );
}
