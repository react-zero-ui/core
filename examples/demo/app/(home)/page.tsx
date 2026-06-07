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
import { cn } from "fumadocs-ui/utils/cn";
import Link from "next/link";
import { ArrowRight, Zap, Layers, Feather, Github } from "lucide-react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Comparison } from "./_components/Comparison";
import { SITE_CONFIG, SITE_SLUGS } from "@/app/config/site-config";
import { CopyCommand } from "./_components/CopyCommand";
import { Footer } from "./_components/Footer";

export const metadata: Metadata = { title: { absolute: SITE_CONFIG.title }, description: SITE_CONFIG.description, alternates: { canonical: SITE_SLUGS.home } };

export default function HomePage() {
	return (
		<>
			<main className="flex flex-1 flex-col  ">
				<Hero />
				<MentalModel />
				<Demo />
				<WhyFast />
			</main>
			<Footer />
		</>
	);
}

function Hero() {
	return (
		<section className="mx-auto w-full max-w-5xl px-6 pt-8 pb-16 text-center sm:pt-16 relative">
			<div
				aria-hidden="true"
				className="sm:bg-fd-primary/10 bg-fd-primary/20 absolute -top-1/2 left-1/2 h-full w-full -translate-x-1/2 rounded-full blur-3xl"
			/>
			<div className="text-fd-muted-foreground mb-6 font-mono text-xs">Zero runtime · Zero re-renders · ~350 bytes</div>
			<h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-6xl capitalize">
				React UI state management, <br className="hidden sm:block" />
				powered by <span className="text-fd-primary">CSS</span>.
			</h1>
			<p className="text-fd-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
				<code>pre-render</code> UI state at build time, update interfaces by flipping <code>data-*</code> attributes.
			</p>

			<CopyCommand
				command="npx create-zero-ui"
				label="Copy install command"
			/>

			<div className="flex flex-wrap items-center justify-center gap-3">
				<Link
					href="/docs"
					className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-medium transition-colors">
					Read the Docs <ArrowRight className="h-4 w-4 max-sm:hidden" />
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
				<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Familiar state API. Zero React re-renders.</h2>
				<p className="text-fd-muted-foreground mx-auto max-w-2xl">
					Use <code>useUI()</code> to define visual state, then style it with Tailwind variants like <code>menu-open:translate-x-0</code>. Zero-UI generates the
					CSS at build time, then updates the UI by flipping a <code>data-*</code> attribute.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 ">
				<CodeCard
					label="React useState"
					tone="muted"
					code={`const [menu, setMenu] = useState('closed');
return (
  <aside className={menu === 'open'
    ? 'translate-x-0'
    : '-translate-x-full'}>
    <button onClick={() => setMenu('open');}>
      Open menu
    </button>
  </aside>
);`}
				/>

				<CodeCard
					label="Zero-UI useUI"
					tone="primary"
					code={`const [, setMenu] = useUI('menu', 'closed');
return (
  // automatically generates tailwind variants
  <aside className="menu-open:translate-x-0
                    menu-closed:-translate-x-full">
    <button onClick={() => setMenu('open');}>
      Open menu
    </button>
  </aside>
);`}
				/>
			</div>
		</section>
	);
}

function CodeCard({ label, tone, code }: { label: string; tone: "muted" | "primary"; code: string }) {
	return (
		<div className={"flex flex-col gap-3 min-w-0 "}>
			<div className={cn("text-fd-muted-foreground text-xs font-medium tracking-wide uppercase", tone === "primary" && "text-fd-primary")}>{label}</div>
			<div className={cn(tone === "primary" && "ring-fd-primary/40 ring-2 rounded-xl")}>
				<DynamicCodeBlock
					lang="tsx"
					code={code}
					codeblock={{ allowCopy: false }}
				/>
			</div>
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
						<h3 className="font-medium">Attribute filtering demo</h3>
						<p className="text-fd-muted-foreground text-sm">Search a mounted list by flipping data attributes instead of re-rendering rows.</p>
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
