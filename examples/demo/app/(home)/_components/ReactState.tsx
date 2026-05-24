"use client";

import { useEffect, useRef, useState } from "react";
import { RenderCounter } from "./RenderCounter";
import { RenderHighlight } from "./RenderHighlight";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
type Accent = "violet" | "emerald" | "amber";

const accentBg: Record<Accent, string> = { violet: "bg-violet-500", emerald: "bg-emerald-500", amber: "bg-amber-500" };

const accentText: Record<Accent, string> = { violet: "text-violet-500", emerald: "text-emerald-500", amber: "text-amber-500" };

const accentRing: Record<Accent, string> = {
	violet: "ring-2 ring-violet-400 bg-violet-500",
	emerald: "ring-2 ring-emerald-400 bg-emerald-500",
	amber: "ring-2 ring-amber-400 bg-amber-500",
};

export function ReactState() {
	const [accent, setAccent] = useState<Accent>("violet");
	const [theme, setTheme] = useState<Theme>("dark");
	const [menuOpen, setMenuOpen] = useState<boolean>(false);
	const renderCount = useRef(0);
	renderCount.current += 4;

	const isLight = theme === "light";

	useEffect(() => {
		if (typeof document !== "undefined") {
			setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
		}
	}, [setTheme]);

	return (
		<RenderHighlight
			name="Container"
			className={`flex relative h-full w-full flex-col gap-5 px-6 py-7 **:transition-all **:duration-200 ${isLight ? "bg-white" : "bg-zinc-950"}`}>
			<RenderCounter
				count={renderCount.current}
				className="absolute top-2 right-2"
			/>
			<Header theme={theme} />
			<ThemeSwitcher
				theme={theme}
				setTheme={setTheme}
			/>
			<AccentPicker
				accent={accent}
				setAccent={setAccent}
				theme={theme}
			/>
			<InteractiveCard
				theme={theme}
				menuOpen={menuOpen}
				setMenuOpen={setMenuOpen}
				accent={accent}
			/>
			<StateDisplay
				theme={theme}
				accent={accent}
				menuOpen={menuOpen}
			/>
		</RenderHighlight>
	);
}

function Header({ theme }: { theme: Theme }) {
	const isLight = theme === "light";
	return (
		<div className="relative space-y-1 text-center">
			<h2 className={`text-2xl font-semibold tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>
				React State <span className="max-[450px]:hidden">Management</span>
			</h2>
			<p className={`text-sm ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Re-renders on every change</p>
		</div>
	);
}

function ThemeSwitcher({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
	const isLight = theme === "light";
	return (
		<RenderHighlight
			name="ThemeSwitcher"
			className="flex justify-center">
			<div className={`relative inline-flex rounded-full border p-1 ${isLight ? "border-zinc-200 bg-zinc-100" : "border-zinc-800 bg-zinc-900"}`}>
				<span
					aria-hidden="true"
					className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-transform duration-300 ${isLight ? "bg-white" : "translate-x-full bg-zinc-700"}`}
				/>
				<button
					type="button"
					aria-label="Set light theme"
					onClick={() => setTheme("light")}
					className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium ${isLight ? "text-zinc-900" : "text-zinc-500"}`}>
					<Sun className="h-3.5 w-3.5" /> Light
				</button>
				<button
					type="button"
					aria-label="Set dark theme"
					onClick={() => setTheme("dark")}
					className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium ${isLight ? "text-zinc-500" : "text-white"}`}>
					<Moon className="h-3.5 w-3.5" /> Dark
				</button>
			</div>
		</RenderHighlight>
	);
}

function AccentPicker({ accent, setAccent, theme }: { accent: Accent; setAccent: (a: Accent) => void; theme: Theme }) {
	const isLight = theme === "light";
	const ringOffset = isLight ? "ring-offset-white" : "ring-offset-zinc-950";
	return (
		<RenderHighlight
			name="AccentPicker"
			className="space-y-2.5">
			<h3 className={`text-center text-xs font-medium tracking-wider uppercase ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>Accent</h3>
			<div className="flex justify-center gap-3">
				<button
					aria-label="Set violet accent"
					onClick={() => setAccent("violet")}
					className={`h-7 w-7 rounded-full ring-offset-2 hover:scale-110 ${ringOffset} ${accent === "violet" ? accentRing.violet : "bg-violet-500/40"}`}
				/>
				<button
					aria-label="Set emerald accent"
					onClick={() => setAccent("emerald")}
					className={`h-7 w-7 rounded-full ring-offset-2 hover:scale-110 ${ringOffset} ${accent === "emerald" ? accentRing.emerald : "bg-emerald-500/40"}`}
				/>
				<button
					aria-label="Set amber accent"
					onClick={() => setAccent("amber")}
					className={`h-7 w-7 rounded-full ring-offset-2 hover:scale-110 ${ringOffset} ${accent === "amber" ? accentRing.amber : "bg-amber-500/40"}`}
				/>
			</div>
		</RenderHighlight>
	);
}

function InteractiveCard({ theme, menuOpen, setMenuOpen, accent }: { theme: Theme; menuOpen: boolean; setMenuOpen: (o: boolean) => void; accent: Accent }) {
	const isLight = theme === "light";
	return (
		<RenderHighlight
			name="InteractiveCard"
			className={`mx-auto w-full max-w-sm overflow-hidden rounded-xl border ${isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-zinc-900"}`}>
			<div className="space-y-3 p-5">
				<div className="flex items-center justify-between">
					<h3 className={`text-sm font-semibold ${isLight ? "text-zinc-900" : "text-white"}`}>Panel demo</h3>
					<span
						className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${isLight ? "bg-zinc-200 text-zinc-600" : "bg-zinc-800 text-zinc-400"}`}>
						{menuOpen ? "open" : "closed"}
					</span>
				</div>
				<button
					aria-label="Toggle menu"
					onClick={() => setMenuOpen(!menuOpen)}
					className={`w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 ${accentBg[accent]}`}>
					{menuOpen ? "Close panel" : "Open panel"}
				</button>
			</div>
			<div className={`overflow-hidden transition-[max-height] duration-300 ${menuOpen ? "max-h-24" : "max-h-0"}`}>
				<div className={`border-t p-4 text-center text-xs ${isLight ? "border-zinc-200 text-zinc-600" : "border-zinc-800 text-zinc-400"}`}>
					Slides open and re-renders the tree
				</div>
			</div>
		</RenderHighlight>
	);
}

function StateDisplay({ theme, accent, menuOpen }: { theme: Theme; accent: Accent; menuOpen: boolean }) {
	const isLight = theme === "light";
	return (
		<RenderHighlight
			name="StateDisplay"
			className="max-[450px]:hidden">
			<div
				className={`mx-auto flex w-fit items-center gap-3 rounded-lg border px-3 py-1.5 font-mono text-xs ${isLight ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
				<span>
					theme <span className={`font-medium ${accentText[accent]}`}>{theme}</span>
				</span>
				<span
					aria-hidden="true"
					className={`h-3 w-px ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`}
				/>
				<span>
					accent <span className={`font-medium ${accentText[accent]}`}>{accent}</span>
				</span>
				<span
					aria-hidden="true"
					className={`h-3 w-px ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`}
				/>
				<span>
					panel <span className={`font-medium ${accentText[accent]}`}>{menuOpen ? "open" : "closed"}</span>
				</span>
			</div>
		</RenderHighlight>
	);
}
