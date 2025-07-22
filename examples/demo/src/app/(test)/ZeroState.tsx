'use client';

import { useUI } from '@react-zero-ui/core';

export function TestComponentZero() {
	const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
	const [, setAccent] = useUI<'violet' | 'emerald' | 'amber'>('accent', 'violet');
	const [, setMenuOpen] = useUI<'true' | 'false'>('menu-open', 'false');

	return (
		<div className="theme-light:bg-gray-100 theme-dark:bg-gray-900 flex h-full w-full flex-col justify-between space-y-4 py-8 **:transition-all **:duration-300">
			<Header />
			<ThemeSwitcher setTheme={setTheme} />
			<AccentPicker setAccent={setAccent} />
			<InteractiveCard toggleMenu={() => setMenuOpen((prev) => (prev === 'true' ? 'false' : 'true'))} />
			<StateDisplay />
		</div>
	);
}

// Header Component - Never re-renders!
function Header() {
	return (
		<div className="space-y-2 text-center">
			<h1 className="theme-light:text-gray-900 theme-dark:text-white text-3xl font-bold">Zero UI</h1>

			<p className="theme-light:text-gray-600 theme-dark:text-gray-400">
				Reactive state without re-rendering .<br />
				<span className="text-sm">
					<span className="theme-light:text-gray-900 theme-dark:text-white font-bold">Zero</span> re-renders,{' '}
					<span className="theme-light:text-gray-900 theme-dark:text-white font-bold">Reactive</span> &{' '}
					<span className="theme-light:text-gray-900 theme-dark:text-white font-bold">Global</span> state.
				</span>
			</p>
		</div>
	);
}

// Theme Switcher - Never re-renders!
function ThemeSwitcher({ setTheme }: { setTheme: (t: 'light' | 'dark') => void }) {
	return (
		<div className="flex justify-center gap-2">
			<button
				aria-label="button"
				onClick={() => setTheme('light')}
				className={`theme-light:bg-gray-900 theme-light:text-white theme-dark:bg-gray-700 theme-dark:text-gray-200 rounded-full border border-gray-400 px-6 py-3 font-medium hover:scale-105`}>
				☀️ Light
			</button>
			<button
				aria-label="button"
				onClick={() => setTheme('dark')}
				className={`theme-dark:bg-white theme-dark:text-gray-900 theme-light:bg-gray-200 theme-light:text-gray-600 rounded-full border border-gray-400 px-6 py-3 font-medium hover:scale-105`}>
				🌙 Dark
			</button>
		</div>
	);
}

// Accent Picker - Never re-renders!
function AccentPicker({ setAccent }: { setAccent: (a: 'violet' | 'emerald' | 'amber') => void }) {
	return (
		<div className="space-y-4 pb-2">
			<h2 className="theme-light:text-gray-800 theme-dark:text-gray-200 text-center text-lg font-semibold">Choose Accent</h2>
			<div className="flex justify-center gap-3">
				<button
					aria-label="button"
					onClick={() => setAccent('violet')}
					className="accent-violet:ring-6 accent-violet:ring-violet-200 accent-violet:bg-violet-500 theme-dark:accent-violet:ring-violet-900 h-12 w-12 rounded-full bg-violet-500/50 ring-violet-900 hover:scale-110"
				/>
				<button
					aria-label="button"
					onClick={() => setAccent('emerald')}
					className="accent-emerald:ring-6 accent-emerald:ring-emerald-200 theme-dark:accent-emerald:ring-emerald-900 accent-emerald:bg-emerald-500 h-12 w-12 rounded-full bg-emerald-500/50 hover:scale-110"
				/>
				<button
					aria-label="button"
					onClick={() => setAccent('amber')}
					className="accent-amber:ring-6 accent-amber:ring-amber-200 theme-dark:accent-amber:ring-amber-900 accent-amber:bg-amber-500 h-12 w-12 rounded-full bg-amber-500/50 hover:scale-110"
				/>
			</div>
		</div>
	);
}

// Interactive Card - Never re-renders!
function InteractiveCard({ toggleMenu }: { toggleMenu: () => void }) {
	return (
		<div className="theme-light:bg-gray-50 theme-light:shadow-gray-200 theme-dark:bg-gray-700 theme-dark:shadow-black/50 relative mx-auto max-w-md overflow-hidden rounded-2xl border border-gray-200 shadow-lg transition-all duration-0!">
			<div className="space-y-4 p-6">
				<h3 className="theme-light:text-gray-900 theme-dark:text-white text-xl font-semibold">Open Menu Demo</h3>
				<button
					aria-label="button"
					onClick={toggleMenu}
					className="accent-violet:bg-violet-500 accent-emerald:bg-emerald-500 accent-amber:bg-amber-500 w-full rounded-lg py-3 font-medium text-white hover:scale-[1.02]">
					<span className="menu-open-false:hidden">Close Panel</span>
					<span className="menu-open-true:hidden">Open Panel</span>
				</button>
			</div>

			{/* Sliding Panel */}
			<div className="menu-open-true:max-h-[80px] menu-open-false:max-h-0 overflow-hidden">
				<div className="theme-dark:bg-gray-700 theme-light:bg-white border-t border-gray-200 p-6 transition-all duration-0!">
					<p className="theme-dark:text-gray-300 theme-light:text-gray-600 text-center">✨ This panel slides open without re-rendering!</p>
				</div>
			</div>
		</div>
	);
}

// State Display - Never re-renders!
function StateDisplay() {
	return (
		<div className="max-[450px]:hidden">
			<div className="theme-light:text-gray-500 theme-dark:text-gray-400 **:accent-violet:text-violet-500 **:accent-emerald:text-emerald-500 **:accent-amber:text-amber-500 mt-5 flex justify-center gap-4 space-y-1 text-center font-mono text-sm capitalize">
				<div className="flex gap-1 text-nowrap **:text-nowrap">
					theme: <span className="theme-dark:hidden">Light</span>
					<span className="theme-light:hidden">Dark</span>
				</div>
				<div className="flex gap-1 text-nowrap **:text-nowrap">
					accent:
					<span className="accent-violet:block hidden">Violet</span>
					<span className="accent-emerald:block hidden">Emerald</span>
					<span className="accent-amber:block hidden">Amber</span>
				</div>
				<div className="flex gap-1 text-nowrap **:text-nowrap">
					menu:
					<span className="menu-open-true:hidden">Open</span>
					<span className="menu-open-false:hidden">Closed</span>
				</div>
			</div>
		</div>
	);
}
