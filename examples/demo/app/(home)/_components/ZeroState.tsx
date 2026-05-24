"use client";

import { useEffect, useRef } from "react";
import { useUI } from "@react-zero-ui/core";
import { RenderCounter } from "./RenderCounter";
import { RenderHighlight } from "./RenderHighlight";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
type Accent = "violet" | "emerald" | "amber";

function getInitialTheme(): Theme {
	if (typeof document === "undefined") return "light";
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ZeroState() {
	const initialTheme = useRef<Theme>(getInitialTheme()).current;
	const [, setTheme] = useUI<Theme>("perf-theme", "dark");
	const [, setAccent] = useUI<Accent>("perf-accent", "violet");
	const [, setMenuOpen] = useUI<"true" | "false">("perf-menu-open", "false");
	const renderCount = useRef(0);
	renderCount.current += 1;

	useEffect(() => {
		if (typeof document !== "undefined") {
			setTheme(initialTheme);
		}
	}, [initialTheme, setTheme]);

	return (
		<RenderHighlight className="perf-theme-light:bg-white perf-theme-dark:bg-zinc-950 flex h-full w-full flex-col gap-5 px-6 py-7 **:transition-all **:duration-200">
			<Header renderCount={renderCount.current} />
			<ThemeSwitcher setTheme={setTheme} />
			<AccentPicker setAccent={setAccent} />
			<InteractiveCard toggleMenu={() => setMenuOpen((prev) => (prev === "true" ? "false" : "true"))} />
			<StateDisplay />
		</RenderHighlight>
	);
}

function Header({ renderCount }: { renderCount: number }) {
	return (
		<RenderHighlight
			name="Header"
			className="relative space-y-1 text-center">
			<div className="absolute top-0 right-0">
				<RenderCounter count={renderCount} />
			</div>
			<h2 className="perf-theme-light:text-zinc-900 perf-theme-dark:text-white text-2xl font-semibold tracking-tight">Zero UI</h2>
			<p className="perf-theme-light:text-zinc-500 perf-theme-dark:text-zinc-400 text-sm">Reactive state, zero re-renders</p>
		</RenderHighlight>
	);
}

function ThemeSwitcher({ setTheme }: { setTheme: (t: Theme) => void }) {
	return (
		<RenderHighlight
			name="ThemeSwitcher"
			className="flex justify-center">
			<div className="perf-theme-light:bg-zinc-100 perf-theme-light:border-zinc-200 perf-theme-dark:bg-zinc-900 perf-theme-dark:border-zinc-800 relative inline-flex rounded-full border p-1">
				<span
					aria-hidden="true"
					className="perf-theme-dark:translate-x-full perf-theme-light:bg-white perf-theme-dark:bg-zinc-700 absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-transform duration-300"
				/>
				<button
					type="button"
					aria-label="Set light theme"
					onClick={() => setTheme("light")}
					className="perf-theme-light:text-zinc-900 perf-theme-dark:text-zinc-500 relative z-10 inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium">
					<Sun className="h-3.5 w-3.5" /> Light
				</button>
				<button
					type="button"
					aria-label="Set dark theme"
					onClick={() => setTheme("dark")}
					className="perf-theme-dark:text-white perf-theme-light:text-zinc-500 relative z-10 inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium">
					<Moon className="h-3.5 w-3.5" /> Dark
				</button>
			</div>
		</RenderHighlight>
	);
}

function AccentPicker({ setAccent }: { setAccent: (a: Accent) => void }) {
	return (
		<RenderHighlight
			name="AccentPicker"
			className="space-y-2.5">
			<h3 className="perf-theme-light:text-zinc-500 perf-theme-dark:text-zinc-400 text-center text-xs font-medium tracking-wider uppercase">Accent</h3>
			<div className="flex justify-center gap-3">
				<button
					aria-label="Set violet accent"
					onClick={() => setAccent("violet")}
					className="perf-accent-violet:ring-2 perf-accent-violet:ring-violet-400 perf-accent-violet:bg-violet-500 perf-theme-light:ring-offset-white perf-theme-dark:ring-offset-zinc-950 h-7 w-7 rounded-full bg-violet-500/40 ring-offset-2 hover:scale-110"
				/>
				<button
					aria-label="Set emerald accent"
					onClick={() => setAccent("emerald")}
					className="perf-accent-emerald:ring-2 perf-accent-emerald:ring-emerald-400 perf-accent-emerald:bg-emerald-500 perf-theme-light:ring-offset-white perf-theme-dark:ring-offset-zinc-950 h-7 w-7 rounded-full bg-emerald-500/40 ring-offset-2 hover:scale-110"
				/>
				<button
					aria-label="Set amber accent"
					onClick={() => setAccent("amber")}
					className="perf-accent-amber:ring-2 perf-accent-amber:ring-amber-400 perf-accent-amber:bg-amber-500 perf-theme-light:ring-offset-white perf-theme-dark:ring-offset-zinc-950 h-7 w-7 rounded-full bg-amber-500/40 ring-offset-2 hover:scale-110"
				/>
			</div>
		</RenderHighlight>
	);
}

function InteractiveCard({ toggleMenu }: { toggleMenu: () => void }) {
	return (
		<RenderHighlight
			name="InteractiveCard"
			className="perf-theme-light:bg-zinc-50 perf-theme-light:border-zinc-200 perf-theme-dark:bg-zinc-900 perf-theme-dark:border-zinc-800 mx-auto w-full max-w-sm overflow-hidden rounded-xl border">
			<div className="space-y-3 p-5">
				<div className="flex items-center justify-between">
					<h3 className="perf-theme-light:text-zinc-900 perf-theme-dark:text-white text-sm font-semibold">Panel demo</h3>
					<span className="perf-theme-light:bg-zinc-200 perf-theme-light:text-zinc-600 perf-theme-dark:bg-zinc-800 perf-theme-dark:text-zinc-400 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase">
						<span className="perf-menu-open-true:inline hidden">open</span>
						<span className="perf-menu-open-false:inline hidden">closed</span>
					</span>
				</div>
				<button
					aria-label="Toggle menu"
					onClick={toggleMenu}
					className="perf-accent-violet:bg-violet-500 perf-accent-emerald:bg-emerald-500 perf-accent-amber:bg-amber-500 w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90">
					<span className="perf-menu-open-false:hidden">Close panel</span>
					<span className="perf-menu-open-true:hidden">Open panel</span>
				</button>
			</div>
			<div className="perf-menu-open-true:max-h-24 perf-menu-open-false:max-h-0 overflow-hidden transition-[max-height] duration-300">
				<div className="perf-theme-light:border-zinc-200 perf-theme-light:text-zinc-600 perf-theme-dark:border-zinc-800 perf-theme-dark:text-zinc-400 border-t p-4 text-center text-xs">
					Slides open without re-rendering ✨
				</div>
			</div>
		</RenderHighlight>
	);
}

function StateDisplay() {
	return (
		<RenderHighlight
			name="StateDisplay"
			className="max-[450px]:hidden">
			<div className="perf-theme-light:bg-zinc-50 perf-theme-light:border-zinc-200 perf-theme-light:text-zinc-500 perf-theme-dark:bg-zinc-900 perf-theme-dark:border-zinc-800 perf-theme-dark:text-zinc-400 **:perf-accent-violet:text-violet-500 **:perf-accent-emerald:text-emerald-500 **:perf-accent-amber:text-amber-500 mx-auto flex w-fit items-center gap-3 rounded-lg border px-3 py-1.5 font-mono text-xs">
				<span>
					theme{" "}
					<span className="font-medium">
						<span className="perf-theme-dark:hidden">light</span>
						<span className="perf-theme-light:hidden">dark</span>
					</span>
				</span>
				<span
					aria-hidden="true"
					className="perf-theme-light:bg-zinc-300 perf-theme-dark:bg-zinc-700 h-3 w-px"
				/>
				<span>
					accent{" "}
					<span className="font-medium">
						<span className="perf-accent-violet:inline hidden">violet</span>
						<span className="perf-accent-emerald:inline hidden">emerald</span>
						<span className="perf-accent-amber:inline hidden">amber</span>
					</span>
				</span>
				<span
					aria-hidden="true"
					className="perf-theme-light:bg-zinc-300 perf-theme-dark:bg-zinc-700 h-3 w-px"
				/>
				<span>
					panel{" "}
					<span className="font-medium">
						<span className="perf-menu-open-true:hidden">closed</span>
						<span className="perf-menu-open-false:hidden">open</span>
					</span>
				</span>
			</div>
		</RenderHighlight>
	);
}
