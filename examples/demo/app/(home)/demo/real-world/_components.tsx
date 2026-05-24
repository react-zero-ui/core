"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { useScopedUI } from "@react-zero-ui/core";
import { RenderCounter } from "../../_components/RenderCounter";
import { RenderHighlight } from "../../_components/RenderHighlight";
import { categories, products, type Category, type Product } from "./_data";

type CategoryFilter = Category | "all";

export function RealWorldDemo() {
	return (
		<div className="space-y-6">
			<div className="grid gap-6 lg:grid-cols-2">
				<ReactPane />
				<ZeroUiPane />
			</div>
			<p className="text-fd-muted-foreground text-center text-sm">
				Type in either search box or change a category. The React pane filters by rendering a new list. The Zero-UI pane keeps the full list mounted and flips
				attributes so CSS handles visibility.
			</p>
		</div>
	);
}

function ReactPane() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<CategoryFilter>("all");
	const renderCount = useRef(0);
	renderCount.current += 4;

	const normalizedQuery = query.trim().toLowerCase();
	const filteredProducts = products.filter(
		(product) => (category === "all" || product.category === category) && (normalizedQuery === "" || product.name.toLowerCase().includes(normalizedQuery))
	);

	return (
		<Pane
			className="max-lg:order-2 "
			title="React useState"
			subtitle="Search and category live in React state, every keystroke re-renders this pane. O(n) re-renders."
			renderCount={renderCount.current}>
			<RenderHighlight
				name="SearchInput"
				className="space-y-4">
				<input
					type="search"
					aria-label="Search React products"
					placeholder="Search products..."
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					className="border-fd-border bg-fd-background focus:border-fd-primary w-full rounded-md border px-3 py-2 text-sm outline-none"
				/>
				<CategoryButtons
					value={category}
					onChange={setCategory}
				/>
				<p className="text-fd-muted-foreground text-xs">
					{filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}
					{normalizedQuery ? ` matching "${query.trim()}"` : " visible"}
				</p>
				<ProductList products={filteredProducts} />
			</RenderHighlight>
		</Pane>
	);
}

function ZeroUiPane() {
	const [searchMode, setSearchMode] = useScopedUI<"idle" | "active">("filter-search", "idle");
	const [filterCategory, setCategory] = useScopedUI<CategoryFilter>("demo-filter-category", "all");
	const [filterResults, setResults] = useScopedUI<"has-results" | "empty">("demo-filter-results", "has-results");
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const countRef = useRef<HTMLParagraphElement>(null);
	const categoryRef = useRef<CategoryFilter>("all");
	const renderCount = useRef(0);
	renderCount.current += 1;

	const attachFilterScope = useCallback(
		(node: HTMLDivElement | null) => {
			setSearchMode.ref?.(node);
			setCategory.ref?.(node);
			setResults.ref?.(node);
		},
		[setSearchMode, setCategory, setResults]
	);

	const applyFilter = (rawQuery: string, nextCategory: CategoryFilter) => {
		const query = rawQuery.trim().toLowerCase();
		const items = listRef.current?.querySelectorAll<HTMLElement>("[data-product-row]") ?? [];
		let count = 0;

		setSearchMode(query ? "active" : "idle");
		setCategory(nextCategory);

		items.forEach((item) => {
			const matchesSearch = query === "" || (item.dataset.searchText ?? "").includes(query);
			const matchesCategory = nextCategory === "all" || item.dataset.category === nextCategory;

			item.dataset.searchMatch = matchesSearch ? "true" : "false";
			if (matchesSearch && matchesCategory) count += 1;
		});

		setResults(count === 0 ? "empty" : "has-results");
		if (countRef.current) {
			countRef.current.textContent = `${count} ${count === 1 ? "result" : "results"}${query ? ` matching "${rawQuery.trim()}"` : " visible"}`;
		}
	};

	const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
		applyFilter(event.target.value, categoryRef.current);
	};

	const handleCategory = (nextCategory: CategoryFilter) => {
		categoryRef.current = nextCategory;
		applyFilter(inputRef.current?.value ?? "", nextCategory);
	};

	const handleClear = () => {
		if (inputRef.current) inputRef.current.value = "";
		applyFilter("", categoryRef.current);
	};

	return (
		<RenderHighlight name="ZeroUiPane">
			<Pane
				title="Zero-UI attribute filter"
				subtitle="Search mode, category, and empty state flip data-* attrs; rows stay mounted. Zero re-renders."
				renderCount={renderCount.current}>
				<RenderHighlight
					name="SearchInput"
					className="space-y-4">
					<div
						ref={attachFilterScope}
						data-filter-search={searchMode}
						data-demo-filter-category={filterCategory}
						data-demo-filter-results={filterResults}
						className="space-y-4">
						<div className="relative">
							<input
								ref={inputRef}
								type="search"
								aria-label="Search Zero-UI products"
								placeholder="Search products..."
								onChange={handleSearch}
								className="border-fd-border bg-fd-background focus:border-fd-primary w-full rounded-md border px-3 py-2 pr-16 text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
							/>
							<button
								type="button"
								aria-label="Clear Zero-UI search"
								onClick={handleClear}
								className="filter-search-active:inline-flex text-fd-muted-foreground hover:text-fd-foreground absolute top-1/2 right-3 hidden -translate-y-1/2 text-xs font-medium transition-colors">
								Clear
							</button>
						</div>
						<ZeroUiCategoryButtons onChange={handleCategory} />
						<p
							ref={countRef}
							className="text-fd-muted-foreground text-xs">
							{products.length} results visible
						</p>
						<ul
							ref={listRef}
							className="divide-fd-border divide-y">
							{products.map((product) => (
								<li
									key={product.id}
									data-product-row
									data-category={product.category}
									data-search-match="true"
									data-search-text={product.name.toLowerCase()}
									className="demo-filter-category-books:[&:not([data-category=books])]:hidden demo-filter-category-clothing:[&:not([data-category=clothing])]:hidden demo-filter-category-electronics:[&:not([data-category=electronics])]:hidden filter-search-active:data-[search-match=false]:hidden flex items-center justify-between gap-3 py-2.5 text-sm">
									<div>
										<div className="font-medium">{product.name}</div>
										<div className="text-fd-muted-foreground text-xs capitalize">{product.category}</div>
									</div>
									<div className="font-mono text-sm tabular-nums">${product.price}</div>
								</li>
							))}
						</ul>
						<p className="demo-filter-results-empty:block text-fd-muted-foreground hidden py-8 text-center text-sm">No products match.</p>
					</div>
				</RenderHighlight>
			</Pane>
		</RenderHighlight>
	);
}
ZeroUiPane.displayName = "ZeroUiPane";

CategoryButtons.displayName = "CategoryButtons";
function CategoryButtons({ value, onChange }: { value: CategoryFilter; onChange: (value: CategoryFilter) => void }) {
	return (
		<div className="flex flex-wrap gap-2">
			{categories.map((category) => {
				const active = category.value === value;
				return (
					<RenderHighlight
						key={category.value}
						name={category.label}>
						<button
							key={category.value}
							type="button"
							onClick={() => onChange(category.value)}
							className={[
								"rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
								active ? "bg-fd-primary text-fd-primary-foreground border-fd-primary" : "border-fd-border hover:bg-fd-accent",
							].join(" ")}>
							{category.label}
						</button>
					</RenderHighlight>
				);
			})}
		</div>
	);
}

function ZeroUiCategoryButtons({ onChange }: { onChange: (value: CategoryFilter) => void }) {
	return (
		<RenderHighlight
			name="ZeroUiCategoryButtons"
			className="flex flex-wrap gap-2">
			{categories.map((category) => (
				<button
					key={category.value}
					type="button"
					onClick={() => onChange(category.value)}
					className={[
						"border-fd-border hover:bg-fd-accent rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
						category.value === "all"
							? "demo-filter-category-all:bg-fd-primary demo-filter-category-all:text-fd-primary-foreground demo-filter-category-all:border-fd-primary"
							: "",
						category.value === "electronics"
							? "demo-filter-category-electronics:bg-fd-primary demo-filter-category-electronics:text-fd-primary-foreground demo-filter-category-electronics:border-fd-primary"
							: "",
						category.value === "books"
							? "demo-filter-category-books:bg-fd-primary demo-filter-category-books:text-fd-primary-foreground demo-filter-category-books:border-fd-primary"
							: "",
						category.value === "clothing"
							? "demo-filter-category-clothing:bg-fd-primary demo-filter-category-clothing:text-fd-primary-foreground demo-filter-category-clothing:border-fd-primary"
							: "",
					].join(" ")}>
					{category.label}
				</button>
			))}
		</RenderHighlight>
	);
}

function Pane({
	title,
	subtitle,
	renderCount,
	children,
	className,
}: {
	title: string;
	subtitle: string;
	renderCount: number;
	children: ReactNode;
	className?: string;
}) {
	return (
		<RenderHighlight
			name={"Pane"}
			className={["border-fd-border bg-fd-card flex flex-col gap-4 rounded-xl border p-5", className].join(" ")}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-semibold">{title}</h3>
					<p className="text-fd-muted-foreground mt-1 text-xs">{subtitle}</p>
				</div>
				<RenderCounter
					count={renderCount}
					className="shrink-0"
				/>
			</div>
			<div className="min-h-[18rem]">{children}</div>
		</RenderHighlight>
	);
}

function ProductList({ products }: { products: Product[] }) {
	if (products.length === 0) {
		return (
			<RenderHighlight name="ProductList">
				<p className="text-fd-muted-foreground py-8 text-center text-sm">No products match.</p>
			</RenderHighlight>
		);
	}

	return (
		<RenderHighlight name="ProductList">
			<ul className="divide-fd-border divide-y">
				{products.map((product) => (
					<li
						key={product.id}
						className="flex items-center justify-between gap-3 py-2.5 text-sm">
						<div>
							<div className="font-medium">{product.name}</div>
							<div className="text-fd-muted-foreground text-xs capitalize">{product.category}</div>
						</div>
						<div className="font-mono text-sm tabular-nums">${product.price}</div>
					</li>
				))}
			</ul>
		</RenderHighlight>
	);
}
