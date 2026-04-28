import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { RealWorldDemo } from './_components';

export const metadata = {
  title: 'Real-world demo · React Zero-UI',
  description: 'Searchable list with skeleton loading — React useState vs the Zero-UI hybrid pattern.',
};

export default function RealWorldDemoPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-10">
        <Link
          href="/"
          className="text-fd-muted-foreground hover:text-fd-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">The hybrid pattern.</h1>
        <p className="text-fd-muted-foreground max-w-2xl text-base">
          Use <code className="font-mono text-sm">useState</code> for what changes (the product data) and <code className="font-mono text-sm">useUI</code>{' '}
          for how it looks (the loading skeleton). Both panes below fetch the same mock data with a 650&nbsp;ms delay — only the React
          version re-renders when the skeleton appears and disappears.
        </p>
      </div>

      <RealWorldDemo />

      <div className="border-fd-border mt-12 grid gap-6 border-t pt-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-base font-semibold">The code that matters</h2>
          <DynamicCodeBlock
            lang="tsx"
            code={`const [data, setData] = useState([]);
const [, setStatus] = useUI(
  'search-status',
  'idle',
);

useEffect(() => {
  setStatus('loading');      // no re-render
  fetchResults(query).then((r) => {
    setData(r);              // 1 re-render
    setStatus('success');    // no re-render
  });
}, [query]);`}
          />
        </div>
        <div>
          <h2 className="mb-2 text-base font-semibold">When to reach for this</h2>
          <ul className="text-fd-muted-foreground space-y-2 text-sm">
            <li>— Presentation states (loading, expanded, focused) flip a data-attribute.</li>
            <li>— Actual data (fetched items, form values) stays in React state.</li>
            <li>— The expensive tree (the list) only re-renders when the data changes.</li>
            <li>— The skeleton appears instantly via CSS, not via React reconciliation.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
