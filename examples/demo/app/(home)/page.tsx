/**
# Primary Topical Cluster Target: React UI state management

## Data Notes
- Source: Google Keyword Planner via gsc-mcp, plus Search Console data for zero-ui.dev
- Location: United States
- Pulled: 2026-05-23
- Seeds used: react state management, react zero rerender, react performance, tailwind variants
- Exclusions: React Native performance terms, MobX/Jotai/Apollo competitor terms, generic React tutorial intent, icon sprite terms

## Keywords to Target
| Keyword | Avg. monthly searches |
| --- | ---: |
| react state management | 1,600 |
| react state manager | 1,600 |
| react performance optimization | 590 |
| tailwind variants | 390 |
| state management in react | 140 |
| react global state | 90 |
| zero ui | 90 |
| best state management for react | 40 |
| react global state management | 30 |
| react re render | 30 |
| react zero ui | 10 |
| css state management | 10 |

## Positioning Notes
- Position the homepage around UI/presentation state management, not server state or business data.
- Tie the high-volume state-management terms to the differentiator: zero React re-renders via data attributes and CSS.
- Support performance and Tailwind intent with proof sections, generated variants, and the existing benchmark/demo links.
*/

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Layers, Feather, Github } from "lucide-react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Comparison } from "./_components/Comparison";
import { SITE_CONFIG, SITE_SLUGS } from "@/app/config/site-config";

export const metadata: Metadata = { title: { absolute: SITE_CONFIG.title }, description: SITE_CONFIG.description, alternates: { canonical: SITE_SLUGS.home } };

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col relative">
			<Hero />
			<MentalModel />
			<Demo />
			<WhyFast />
			<SocialProof />
			<a
				href="https://www.serbyte.net/"
				className="absolute bottom-4 left-4 text-fd-muted-foreground text-xs max-lg:left-1/2 max-lg:-translate-x-[50%]">
				Built by Serbyte Web Design & Development
			</a>
		</main>
	);
}

function Hero() {
	return (
		<section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
			<div className="text-fd-muted-foreground mb-6 font-mono text-xs">Zero runtime · Zero re-renders · ~350 bytes</div>
			<h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-6xl">
				Ultra-fast React UI state, <br className="hidden sm:block" />
				powered by <span className="text-fd-primary">CSS</span>.
			</h1>
			<p className="text-fd-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
				React Zero-UI <em className="font-medium text-fd-primary">pre-renders</em> UI state at build time, giving you built-in global state without providers,
				re-renders, or hydration headaches.
			</p>

			<div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border bg-fd-card px-4 py-2 font-mono text-sm">
				<span className="text-fd-muted-foreground">$</span>
				<span>npx create-zero-ui</span>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-3">
				<Link
					href="/docs"
					className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-medium transition-colors">
					Read the Docs <ArrowRight className="h-4 w-4" />
				</Link>
				<Link
					href="/demo/real-world"
					className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-5 py-2.5 font-medium transition-colors">
					See it in action
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
					Themes, modals, sidebars, accents - none of that needs to live in React. Zero-UI moves presentation state into the DOM where it belongs, while you
					keep React for the things React is good at.
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

// Zero re-renders.
return (
  <div className="theme-light:bg-white
                  theme-dark:bg-gray-900">
 <button onClick={(prev) =>
      setTheme(prev === 'light'
        ? 'dark' : 'light')
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

function CodeCard({ label, tone, code }: { label: string; tone: "muted" | "primary"; code: string }) {
	return (
		<div className={["border-fd-border bg-fd-card flex flex-col gap-3 rounded-xl border p-5", tone === "primary" ? "ring-fd-primary/40 ring-2" : ""].join(" ")}>
			<div className="text-fd-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</div>
			<DynamicCodeBlock
				lang="tsx"
				code={code}
			/>
		</div>
	);
}

function Demo() {
	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-16">
			<div className="mb-8 text-center">
				<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Try it right here.</h2>
				<p className="text-fd-muted-foreground mx-auto max-w-xl">
					Same UI, built twice. The Zero-UI tab flips <code className="font-mono text-sm">data-*</code> attributes on{" "}
					<code className="font-mono text-sm">&lt;body&gt;</code>; the React tab holds the same state in <code className="font-mono text-sm">useState</code>.
					Watch the render counters as you click around.
				</p>
			</div>
			<Comparison />

			<div className="mt-8 w-fit mx-auto">
				<Link
					href="/demo/real-world"
					className="border-fd-border hover:border-fd-primary hover:bg-fd-accent group flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors">
					<div>
						<div className="font-medium">Attribute filtering demo</div>
						<div className="text-fd-muted-foreground text-sm">Search a mounted list by flipping data attributes instead of re-rendering rows.</div>
					</div>
					<ArrowRight className="text-fd-muted-foreground group-hover:text-fd-primary h-5 w-5 shrink-0 transition-colors" />
				</Link>
			</div>
		</section>
	);
}

function WhyFast() {
	const cards = [
		{
			icon: <Zap className="h-5 w-5" />,
			title: "Zero re-renders",
			body: "State changes flip DOM attributes. React stays completely out of the loop - no reconciliation, no render cycles.",
		},
		{
			icon: <Feather className="h-5 w-5" />,
			title: "~350 bytes",
			body: "Smaller than a single SVG icon. An order of magnitude leaner than Redux or Zustand for UI state.",
		},
		{
			icon: <Layers className="h-5 w-5" />,
			title: 'Build time "pre-rendering"',
			body: "Zero-UI generates all possible UI states at build time vs re-rendering them on the fly.",
		},
	];

	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-16">
			<div className="mb-10 text-center">
				<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Why it's fast.</h2>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{cards.map((c) => (
					<div
						key={c.title}
						className="border-fd-border bg-fd-card rounded-xl border p-6">
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
			<p className="text-fd-muted-foreground mx-auto mb-6 max-w-xl">MIT licensed. Production-ready core, experimental SSR runtime, and a growing demo suite.</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<a
					href="https://github.com/react-zero-ui/core"
					target="_blank"
					rel="nofollow noopener noreferrer"
					className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors">
					<Github className="h-4 w-4" />
					GitHub
				</a>
				<a
					href="https://www.npmjs.com/package/@react-zero-ui/core"
					target="_blank"
					rel="nofollow noopener noreferrer"
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
