import Link from 'next/link';
import { ArrowRight, Zap, Layers, Feather, Github } from 'lucide-react';
import { LandingDemo } from './_components/LandingDemo';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <MentalModel />
      <Demo />
      <WhyFast />
      <SocialProof />
    </main>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
      <div className="border-fd-border text-fd-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
        <span className="bg-fd-primary inline-block h-1.5 w-1.5 rounded-full" />
        Zero runtime · Zero re-renders · ~350 bytes
      </div>
      <h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-6xl">
        Ultra-fast React UI state, <br className="hidden sm:block" />
        powered by <span className="text-fd-primary">CSS</span>.
      </h1>
      <p className="text-fd-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
        React Zero-UI pre-renders every UI state at build time and flips <code className="font-mono text-sm">data-*</code> attributes on the
        fly — giving you global state without providers, re-renders, or hydration headaches.
      </p>

      <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border bg-fd-card px-4 py-2 font-mono text-sm">
        <span className="text-fd-muted-foreground">$</span>
        <span>npm install @react-zero-ui/core</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-medium transition-colors">
          Read the Docs <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/docs/getting-started/next"
          className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-5 py-2.5 font-medium transition-colors">
          Quick start
        </Link>
      </div>
    </section>
  );
}

function MentalModel() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Presentation state is not data state.</h2>
        <p className="text-fd-muted-foreground mx-auto max-w-2xl">
          Themes, modals, sidebars, accents — none of that needs to live in React. Zero-UI moves presentation state into the DOM where it
          belongs, while you keep React for the things React is good at.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CodeCard
          label="React useState"
          tone="muted"
          code={`const [theme, setTheme] = useState('light');

// Every click re-renders the subtree
return (
  <div className={theme === 'dark'
    ? 'bg-gray-900' : 'bg-white'}>
    <button onClick={() =>
      setTheme(theme === 'light'
        ? 'dark' : 'light')
    }>
      Toggle
    </button>
  </div>
);`}
        />
        <CodeCard
          label="Zero-UI useUI"
          tone="primary"
          code={`const [, setTheme] = useUI('theme', 'light');

// No re-renders. Just flips data-theme on <body>.
return (
  <div className="theme-light:bg-white
                  theme-dark:bg-gray-900">
    <button onClick={() =>
      setTheme((p) =>
        p === 'light' ? 'dark' : 'light')
    }>
      Toggle
    </button>
  </div>
);`}
        />
      </div>
    </section>
  );
}

function CodeCard({ label, tone, code }: { label: string; tone: 'muted' | 'primary'; code: string }) {
  return (
    <div
      className={[
        'border-fd-border bg-fd-card rounded-xl border p-5',
        tone === 'primary' ? 'ring-fd-primary/40 ring-2' : '',
      ].join(' ')}>
      <div className="text-fd-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">{label}</div>
      <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Demo() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Try it right here.</h2>
        <p className="text-fd-muted-foreground mx-auto max-w-xl">
          The widget below is wired up with Zero-UI. Open React DevTools — you won't see a single render on click.
        </p>
      </div>
      <LandingDemo />
    </section>
  );
}

function WhyFast() {
  const cards = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Zero re-renders',
      body: 'State changes flip DOM attributes. React stays completely out of the loop — no reconciliation, no render cycles.',
    },
    {
      icon: <Feather className="h-5 w-5" />,
      title: '~350 bytes',
      body: 'Smaller than a single SVG icon. An order of magnitude leaner than Redux or Zustand for UI state.',
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: 'Build-time CSS',
      body: 'Tailwind variants are generated for every possible state at build time. Switching states is just changing a selector match.',
    },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Why it's fast.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="border-fd-border bg-fd-card rounded-xl border p-6">
            <div className="bg-fd-primary/10 text-fd-primary mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg">{c.icon}</div>
            <h3 className="mb-2 text-base font-semibold">{c.title}</h3>
            <p className="text-fd-muted-foreground text-sm">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-24 text-center">
      <h2 className="mb-3 text-2xl font-semibold tracking-tight">Open source. Tiny. Tested.</h2>
      <p className="text-fd-muted-foreground mx-auto mb-6 max-w-xl">
        MIT licensed. Production-ready core, experimental SSR runtime, and a growing demo suite.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="https://github.com/react-zero-ui/core"
          target="_blank"
          rel="noreferrer"
          className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
          <Github className="h-4 w-4" />
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/@react-zero-ui/core"
          target="_blank"
          rel="noreferrer"
          className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
          npm
        </a>
        <Link
          href="/docs/faq"
          className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
          FAQ
        </Link>
      </div>
    </section>
  );
}
