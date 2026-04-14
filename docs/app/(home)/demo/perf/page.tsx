import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Comparison } from './_comparison';

export const metadata = {
  title: 'Zero-UI vs React state · React Zero-UI',
  description: 'Side-by-side comparison: same UI built with React useState and with Zero-UI useUI. Flip between them and watch the re-render cost.',
};

export default function PerfDemoPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-fd-muted-foreground hover:text-fd-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Zero-UI vs React state.</h1>
        <p className="text-fd-muted-foreground max-w-2xl text-base">
          Same UI, built twice. The Zero-UI version flips <code className="font-mono text-sm">data-*</code> attributes on{' '}
          <code className="font-mono text-sm">&lt;body&gt;</code> and lets Tailwind variants do the work. The React version holds the
          same state in <code className="font-mono text-sm">useState</code> and re-renders the component tree on every click. Open React
          DevTools (or install the{' '}
          <a
            href="https://react-scan.com"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2">
            React Scan
          </a>{' '}
          browser extension) to visualize the difference.
        </p>
      </div>

      <Comparison />
    </main>
  );
}
