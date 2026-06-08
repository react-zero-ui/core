/**
# Primary Topical Cluster Target: React icons with SVG sprite output

## Data Notes
- Source: Google Keyword Planner via gsc-mcp, plus Search Console query data for zero-ui.dev
- Location: United States
- Pulled: 2026-06-07
- Seeds used: zero icons, react icon sprite, lucide react icons, tabler icons react
- Exclusions: net zero icons, zero sugar icons, zero waste icons, emissions icons, Creative Commons Zero icons, generic "icon 0" intent

## Keywords to Target
| Keyword | Avg. monthly searches |
| --- | ---: |
| lucide icons | 9,900 |
| lucide react | 9,900 |
| react icons | 9,900 |
| svg icons | 4,400 |
| lucide react icons | 3,600 |
| tabler icons | 2,900 |
| tabler icons react | 720 |
| react icon library | 390 |
| svg sprite | 210 |
| icon sprite | 110 |
| react svg icons | 110 |
| zero icons | 90 |
| react tabler icons | 70 |
| svg sprite sheet | 30 |
| svg icon sprite | 10 |

## Positioning Notes
- Lead with React icon library and Lucide/Tabler intent because exact "react icon sprite" demand is too small to carry the page alone.
- Use "SVG sprite", "icon sprite", and "sprite sheet" as the performance proof and differentiator.
- Search Console already shows zero-ui.dev receiving impressions for "icon sprite", so keep this as a real page instead of redirecting the legacy route.
*/

import type { Metadata } from "next";
import Link from "next/link";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { SITE_SLUGS } from "@/app/config/site-config";
import { CopyCommand } from "../_components/CopyCommand";
import { Footer, iconSpriteFooterCta } from "../_components/Footer";
import { HeroIconBackdrop, sampleIcons } from "./hero-icon-backdrop";
import { ArrowRight } from "@react-zero-ui/icon-sprite";

export const metadata: Metadata = {
	title: "React Icon Sprite for Lucide & Tabler | React Zero-UI",
	description: "Use Lucide and Tabler React icons as components, then compile only the SVG icons you use into one cached sprite sheet at build time.",
	alternates: { canonical: SITE_SLUGS.iconSprite },
};

export default function IconSpritePage() {
	return (
		<>
			<main className="flex flex-1 flex-col">
				<Hero />
				<DevProdOutput />
				<Benchmark />
				<IconSample />
				<Workflow />
			</main>
			<Footer cta={iconSpriteFooterCta} />
		</>
	);
}

function Hero() {
	return (
		<section className="relative isolate overflow-hidden border-b border-fd-border">
			<HeroIconBackdrop />

			<div className="relative mx-auto flex min-h-[520px] w-full max-w-5xl items-center px-6 py-16 md:min-h-[620px] md:py-24">
				<div className="max-w-2xl">
					<p className="mb-4 font-mono text-xs text-fd-muted-foreground">@react-zero-ui/icon-sprite</p>
					<h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-6xl">
						React icons. <span className="text-fd-primary">SVG sprite output.</span>
					</h1>
					<p className="mb-6 max-w-xl text-base text-fd-muted-foreground">
						Full Lucide and Tabler icon support. At build time only the icons you actually used are packed into one cached SVG sprite.
					</p>

					<div className="mb-8 flex flex-wrap gap-2">
						{["Zero runtime", "6,800+ icons", "~62% smaller HTML"].map((feature) => (
							<span
								key={feature}
								className="rounded-full border border-fd-border bg-fd-card/70 px-3 py-1 font-mono text-xs text-fd-muted-foreground">
								{feature}
							</span>
						))}
					</div>

					<CopyCommand
						command="npm i @react-zero-ui/icon-sprite"
						label="Copy install command"
						className="max-sm:text-xs"
					/>

					<div className="flex text-nowrap gap-3">
						<a
							href="https://github.com/react-zero-ui/icon-sprite#readme"
							target="_blank"
							rel="noreferrer nofollow"
							className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-medium transition-colors max-sm:text-xs">
							Read the README <ArrowRight className="h-4 w-4" />
						</a>
						<Link
							href="https://www.npmjs.com/package/@react-zero-ui/icon-sprite"
							target="_blank"
							rel="noreferrer nofollow"
							className="border-fd-border bg-fd-background/70 hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-5 py-2.5 font-medium transition-colors max-sm:text-xs">
							View on NPM
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

function Benchmark() {
	const lucideSizeKb = 19.5;
	const spriteSizeKb = 7.5;
	const savedPercent = Math.round(((lucideSizeKb - spriteSizeKb) / lucideSizeKb) * 100);

	const rows = [
		{ metric: "Rendered icons", lucide: "150", sprite: "150", delta: "Same UI" },
		{ metric: "HTML output", lucide: "19.5kb", sprite: "7.5kb", delta: `-${savedPercent}%`, highlight: true },
		{ metric: "SVG strategy", lucide: "Inline SVG", sprite: "Sprite <use />", delta: "Less repeated markup" },
		{ metric: "Browser caching", lucide: "Per document", sprite: "Shared sprite file", delta: "Reusable" },
	];

	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-16">
			<div className="mb-8 max-w-2xl">
				<p className="mb-3 font-mono text-xs uppercase tracking-wide text-fd-primary">Benchmark</p>
				<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Same icons. Smaller HTML.</h2>
				<p className="text-fd-muted-foreground">
					This benchmark renders the same 150-icon UI twice: once with normal inline React SVG icons, and once with generated sprite output from{" "}
					<code>@react-zero-ui/icon-sprite</code>.
				</p>
			</div>

			<div className="mb-6 grid gap-4 md:grid-cols-3">
				<BenchmarkStat
					label="Lucide React HTML"
					value="19.5kb"
					body="Repeated inline SVG markup in the page output."
				/>
				<BenchmarkStat
					label="Sprite HTML"
					value="7.5kb"
					body="Small SVG references pointing to one generated sprite."
					highlight
				/>
				<BenchmarkStat
					label="HTML saved"
					value={`${savedPercent}%`}
					body="Measured against the same icon count and page structure."
					highlight
				/>
			</div>

			<div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card">
				<table className="w-full text-sm">
					<thead className="border-b border-fd-border bg-fd-muted/50 text-left">
						<tr>
							<th className="px-4 py-3 font-medium">Metric</th>
							<th className="px-4 py-3 font-medium">lucide-react</th>
							<th className="px-4 py-3 font-medium">@react-zero-ui/icon-sprite</th>
							<th className="px-4 py-3 font-medium">Result</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.metric}
								className="border-b border-fd-border last:border-b-0">
								<td className="px-4 py-3 text-fd-muted-foreground">{row.metric}</td>
								<td className="px-4 py-3 font-mono">{row.lucide}</td>
								<td className="px-4 py-3 font-mono">{row.sprite}</td>
								<td className={row.highlight ? "px-4 py-3 font-medium text-fd-primary" : "px-4 py-3 text-fd-muted-foreground"}>{row.delta}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<p className="mt-4 max-w-3xl text-sm text-fd-muted-foreground">
				The benefit grows on icon-heavy pages such as dashboards, tables, menus, pricing pages, admin panels, and documentation sites where the same icons are
				rendered many times.
			</p>
		</section>
	);
}

function DevProdOutput() {
	const written = `import { Settings } from "@react-zero-ui/icon-sprite";

<Settings size={24} className="text-fd-primary" />`;

	const devOutput = `<!-- dev: renders the real Lucide component -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
>
  <path d="M9.671 4.136a2.34 2.34 0 0 1
	4.659 0 2.34 2.34 0 0 0 3.319 1.915
	2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831
	2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319
	1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915
	2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34
	2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.32-1.915" />
  <circle cx="12" cy="12" r="3" />
</svg>`;

	const prodOutput = `<!-- prod: after npx zero-icons -->
<svg
  width="24"
  height="24"
>
  <use href="/icons.svg#settings" />
</svg>`;

	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-16">
			<div className="mb-8 max-w-2xl">
				<p className="mb-3 font-mono text-xs uppercase tracking-wide text-fd-primary">How it works</p>
				<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">One component. Two outputs.</h2>
				<p className="text-fd-muted-foreground">
					Use just like Lucide. In development it renders the real svg icon, without the aggressive sprite caching that normally forces you to reopen the tab to
					see edits to an icon. At build time only icons you used are packed into one cached SVG sprite.
				</p>
			</div>

			<div className="mb-6">
				<div className="mb-2 font-mono text-xs uppercase tracking-wide text-fd-muted-foreground">What you write</div>
				<DynamicCodeBlock
					lang="tsx"
					code={written}
					codeblock={{ allowCopy: false }}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2 overflow-hidden">
				<div>
					<div className="mb-2 font-mono text-xs uppercase tracking-wide text-fd-muted-foreground">Development · real component</div>
					<div className="h-72 overflow-y-auto">
						<DynamicCodeBlock
							lang="html"
							code={devOutput}
							codeblock={{ allowCopy: false }}
						/>
					</div>
				</div>

				<div>
					<div className="mb-2 font-mono text-xs uppercase tracking-wide text-fd-primary">Production · sprite reference</div>
					<DynamicCodeBlock
						lang="html"
						code={prodOutput}
						codeblock={{ allowCopy: false }}
					/>
				</div>
			</div>
		</section>
	);
}

function BenchmarkStat({ label, value, body, highlight = false }: { label: string; value: string; body: string; highlight?: boolean }) {
	return (
		<div className={`rounded-xl border p-6 ${highlight ? "border-fd-primary bg-fd-primary/5" : "border-fd-border bg-fd-card"}`}>
			<div className="mb-2 font-mono text-xs uppercase tracking-wide text-fd-muted-foreground">{label}</div>
			<div className="mb-3 text-4xl font-bold tracking-tight">{value}</div>
			<p className="text-sm text-fd-muted-foreground">{body}</p>
		</div>
	);
}

function IconSample() {
	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-16">
			<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Lucide and Tabler, one import path.</h2>
					<p className="max-w-2xl text-fd-muted-foreground">
						Lucide names and Tabler's <code>Icon*</code> names are built in, with support for your own SVGs under <code>/public/zero-ui-icons</code>.
					</p>
				</div>
				<div className="font-mono text-xs text-fd-muted-foreground">6,800+ icons</div>
			</div>

			<div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-12">
				{sampleIcons.map((Icon, index) => (
					<div
						key={index}
						className="grid aspect-square place-items-center rounded-lg bg-fd-muted text-fd-foreground transition-colors hover:bg-fd-primary hover:text-fd-primary-foreground">
						<Icon
							size={24}
							strokeWidth={1}
							className="size-6 max-sm:size-5"
						/>
					</div>
				))}
			</div>
		</section>
	);
}

function Workflow() {
	const code = `{
  "scripts": {
    "prebuild": "zero-icons",
   }
}`;
	const iconUsage = `import { Settings } from "@react-zero-ui/icon-sprite";

<Settings size={24} className="text-fd-primary" />`;

	return (
		<section className="mx-auto w-full max-w-5xl px-6 py-16">
			<div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
				<div className="">
					<h2 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">No sprite busywork.</h2>
					<p className="mb-6 text-fd-muted-foreground">
						Write component imports during development. Add <code>zero-icons</code> before your production build. The scanner handles the sprite sheet.
					</p>
					<div className="space-y-3 text-sm ">
						<WorkflowStep
							title="1. Import components"
							body="Keep the same prop shape you expect from icon libraries."
						/>
						<WorkflowStep
							title="2. Add the prebuild hook"
							body="zero-icons scans for used Lucide, Tabler, and custom icons before every production build."
						/>
						<WorkflowStep
							title="3. Ship one sprite"
							body="Browsers cache the sprite while your HTML stays small."
						/>
					</div>
				</div>
				<div className="overflow-hidden">
					<div className="mb-6 ">
						<DynamicCodeBlock
							lang="tsx"
							code={iconUsage}
							codeblock={{ allowCopy: false }}
						/>
					</div>
					<DynamicCodeBlock
						lang="json"
						code={code}
						codeblock={{ allowCopy: false }}
					/>
				</div>
			</div>
		</section>
	);
}

function WorkflowStep({ title, body }: { title: string; body: string }) {
	return (
		<div className="border-l border-fd-border pl-4">
			<div className="font-medium">{title}</div>
			<p className="text-fd-muted-foreground">{body}</p>
		</div>
	);
}
