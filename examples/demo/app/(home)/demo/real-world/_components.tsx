"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { useUI } from "@react-zero-ui/core";
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
	renderCount.current += 1;

	const normalizedQuery = query.trim().toLowerCase();
	const filteredProducts = products.filter(
		(product) => (category === "all" || product.category === category) && (normalizedQuery === "" || product.name.toLowerCase().includes(normalizedQuery))
	);

	return (
		<Pane
			title="React useState"
			subtitle="Search and category live in React state, so every keystroke re-renders this pane."
			renderCount={renderCount.current}>
			<div className="space-y-4">
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
			</div>
		</Pane>
	);
}

function ZeroUiPane() {
	const [, setSearchMode] = useUI<"idle" | "active">("demo-filter-search", "idle");
	const [, setCategory] = useUI<CategoryFilter>("demo-filter-category", "all");
	const [, setResults] = useUI<"has-results" | "empty">("demo-filter-results", "has-results");
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const countRef = useRef<HTMLParagraphElement>(null);
	const categoryRef = useRef<CategoryFilter>("all");
	const renderCount = useRef(0);
	renderCount.current += 1;

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
		<Pane
			title="Zero-UI attribute filter"
			subtitle="The input is uncontrolled. Search mode, category, and empty state flip data-* attrs; rows stay mounted."
			renderCount={renderCount.current}>
			<div className="space-y-4">
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
						className="demo-filter-search-active:inline-flex text-fd-muted-foreground hover:text-fd-foreground absolute top-1/2 right-3 hidden -translate-y-1/2 text-xs font-medium transition-colors">
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
							className="demo-filter-category-books:[&:not([data-category=books])]:hidden demo-filter-category-clothing:[&:not([data-category=clothing])]:hidden demo-filter-category-electronics:[&:not([data-category=electronics])]:hidden demo-filter-search-active:data-[search-match=false]:hidden flex items-center justify-between gap-3 py-2.5 text-sm">
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
		</Pane>
	);
}

function CategoryButtons({ value, onChange }: { value: CategoryFilter; onChange: (value: CategoryFilter) => void }) {
	return (
		<div className="flex flex-wrap gap-2">
			{categories.map((category) => {
				const active = category.value === value;
				return (
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
				);
			})}
		</div>
	);
}

function ZeroUiCategoryButtons({ onChange }: { onChange: (value: CategoryFilter) => void }) {
	return (
		<div className="flex flex-wrap gap-2">
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
		</div>
	);
}

function Pane({ title, subtitle, renderCount, children }: { title: string; subtitle: string; renderCount: number; children: ReactNode }) {
	return (
		<div className="border-fd-border bg-fd-card flex flex-col gap-4 rounded-xl border p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-semibold">{title}</h3>
					<p className="text-fd-muted-foreground mt-1 text-xs">{subtitle}</p>
				</div>
				<div className="border-fd-primary/30 bg-fd-primary/10 text-fd-primary inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs">
					renders:{" "}
					<span
						className="font-semibold"
						suppressHydrationWarning>
						{renderCount}
					</span>
				</div>
			</div>
			<div className="min-h-[18rem]">{children}</div>
		</div>
	);
}

function ProductList({ products }: { products: Product[] }) {
	if (products.length === 0) {
		return <p className="text-fd-muted-foreground py-8 text-center text-sm">No products match.</p>;
	}

	return (
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
	);
}
