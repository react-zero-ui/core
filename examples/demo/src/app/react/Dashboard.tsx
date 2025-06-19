'use client';
import { useState } from 'react';
import { InnerDot } from './InnerDot';
import Link from 'next/link';

export const Dashboard: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Define theme classes based on state
  const containerClasses = theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-900 text-gray-200';

  const itemClasses = theme === 'light' ? 'bg-gray-900 text-gray-200' : 'bg-gray-200 text-gray-900';
  const itemClasses2 = theme === 'dark' ? 'bg-red-400' : 'bg-blue-400';

  return (
    <div className={`${containerClasses} flex h-screen w-screen flex-col items-center justify-start p-5`}>
      <div className="flex flex-row items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
          className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Toggle Theme (Current: {theme})
        </button>
        <Link href="/zero-ui" className="rounded-md px-4 py-2 text-blue-500 underline transition-colors">
          Zero-UI 10k Node Test
        </Link>
      </div>
      <div className="text-lg text-gray-500">10,000 nodes with Nested Node using React State</div>
      <div
        className="grid aspect-square max-h-full w-full max-w-full gap-0.5 text-xs"
        style={{
          gridTemplateColumns: 'repeat(100, 1fr)',
          gridTemplateRows: 'repeat(100, 1fr)',
          width: 'min(100vw - 2.5rem, 100vh - 8rem)',
          height: 'min(100vw - 2.5rem, 100vh - 8rem)',
        }}
      >
        {Array.from({ length: 10000 }).map((_, index) => (
          <div key={index} className={`${itemClasses} flex items-center justify-center rounded-sm`}>
            <InnerDot itemClasses2={itemClasses2} />
          </div>
        ))}
      </div>
    </div>
  );
};
