import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { SITE_SLUGS } from "@/app/config/site-config";
import { RealWorldDemo } from "./_components";

export const metadata: Metadata = {
	title: "Real-world demo · React Zero-UI",
	description: "Searchable list filtering - React useState vs Zero-UI attribute filtering.",
	alternates: { canonical: SITE_SLUGS.realWorldDemo },
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
				<h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">Search without re-rendering the list.</h1>
				<p className="text-fd-muted-foreground max-w-2xl text-base">
					React usually filters by deriving a new array and reconciling a new list. React Zero-UI can keep the rows mounted, flip{" "}
					<code className="font-mono text-sm">data-*</code> attributes, and let CSS hide the non-matches.
				</p>
			</div>

			<div className="border-fd-primary/25 bg-fd-primary/5 text-fd-muted-foreground mb-6 flex max-w-2xl gap-3 rounded-xl border p-4 text-sm">
				<Lightbulb className="text-fd-primary mt-0.5 h-4 w-4 shrink-0" />
				<p>Type a search in both panes and switch categories. React re-renders the list; Zero-UI just toggles visibility.</p>
			</div>

			<RealWorldDemo />

			<div className="border-fd-border mt-12 grid gap-6 border-t pt-8 sm:grid-cols-2">
				<div>
					<h2 className="mb-2 text-base font-semibold">The code that matters</h2>
					<DynamicCodeBlock
						lang="tsx"
						code={`const [mode, setMode] = useScopedUI('filter-search', 'idle');

function search(query: string) {
  setMode(query ? 'active' : 'idle');

  rows.forEach((row) => {
    row.dataset.searchMatch =
      row.dataset.searchText?.includes(query)
        ? 'true'
        : 'false';
  });
}

<div ref={setMode.ref} data-filter-search={mode}>
<li
  data-search-match="true"
  className="filter-search-active:data-[search-match=false]:hidden"
/>
</div>`}
					/>
				</div>
				<div>
					<h2 className="mb-2 text-base font-semibold">When to reach for this</h2>
					<ul className="text-fd-muted-foreground space-y-2 text-sm">
						<li>- The list is already loaded and filtering is purely presentational.</li>
						<li>- Search text is unbounded, so JS marks matching rows.</li>
						<li>- Finite UI states like active search, category, and empty state flip data attributes.</li>
						<li>- The expensive tree stays mounted while CSS controls visibility.</li>
					</ul>
				</div>
			</div>
		</main>
	);
}
