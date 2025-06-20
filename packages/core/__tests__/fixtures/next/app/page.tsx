'use client';

import useUI from '@austinserb/react-zero-ui';
import { useEffect, useState } from 'react';

// Component that automatically cycles through themes using useEffect
function AutoThemeComponent() {
	const [, setAutoTheme] = useUI<'light' | 'dark'>('auto-theme', 'light');
	const [isRunning, setIsRunning] = useState(false);
	const [cycleCount, setCycleCount] = useState(0);

	useEffect(() => {
		if (!isRunning) return;

		const interval = setInterval(() => {
			setAutoTheme(prev => {
				const newTheme = prev === 'light' ? 'dark' : 'light';
				setCycleCount(count => count + 1);
				return newTheme;
			});
		}, 2000); // Switch every 2 seconds

		return () => clearInterval(interval);
	}, [isRunning, setAutoTheme]);

	return (
		<div
			className="auto-theme-light:bg-blue-50 auto-theme-dark:bg-blue-900 auto-theme-light:border-blue-200 auto-theme-dark:border-blue-700 border-2 rounded-lg p-6 transition-colors duration-500"
			data-testid="auto-theme-container">
			<h3 className="auto-theme-light:text-blue-900 auto-theme-dark:text-blue-100 text-xl font-bold mb-4">Auto Theme Switcher (useEffect Test)</h3>

			<div className="space-y-4">
				<button
					type="button"
					onClick={() => setIsRunning(prev => !prev)}
					className="auto-theme-light:bg-blue-600 auto-theme-dark:bg-blue-400 auto-theme-light:text-white auto-theme-dark:text-blue-900 auto-theme-light:hover:bg-blue-700 auto-theme-dark:hover:bg-blue-300 px-4 py-2 rounded-md font-medium transition-colors"
					data-testid="auto-theme-toggle">
					{isRunning ? 'Stop Auto Theme' : 'Start Auto Theme'}
				</button>

				<div className="auto-theme-light:bg-white auto-theme-dark:bg-blue-800 auto-theme-light:border-blue-100 auto-theme-dark:border-blue-600 border rounded-md p-4">
					<div className="space-y-2">
						<div className="auto-theme-light:text-blue-800 auto-theme-dark:text-blue-200">
							Current Theme:
							<span className="auto-theme-light:block hidden font-semibold text-blue-600"> Light Mode</span>
							<span className="auto-theme-dark:block hidden font-semibold text-blue-300"> Dark Mode</span>
						</div>

						<div className="auto-theme-light:text-blue-600 auto-theme-dark:text-blue-400 text-sm">Status: {isRunning ? 'Auto-switching...' : 'Stopped'}</div>

						<div className="auto-theme-light:text-blue-500 auto-theme-dark:text-blue-500 text-sm">Cycle Count: {cycleCount}</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="auto-theme-light:bg-green-100 auto-theme-dark:bg-green-800 auto-theme-light:text-green-800 auto-theme-dark:text-green-200 p-3 rounded text-center">
						<div className="auto-theme-light:block hidden">☀️ Light Theme Active</div>
						<div className="auto-theme-dark:block hidden">🌙 Dark Theme Active</div>
					</div>

					<div className="auto-theme-light:bg-purple-100 auto-theme-dark:bg-purple-800 auto-theme-light:text-purple-800 auto-theme-dark:text-purple-200 p-3 rounded text-center">
						<div className="auto-theme-light:text-purple-600 auto-theme-dark:text-purple-300">Reactive UI</div>
						<div className="text-sm mt-1">No Re-renders!</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function Page() {
	const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
	const [, setTheme2] = useUI<'light' | 'dark'>('theme-2', 'light');
	const [, setThemeThree] = useUI<'light' | 'dark'>('themeThree', 'light');
	return (
		<>
			{/* Auto Theme Component - NEW */}
			<AutoThemeComponent />

			<hr className="my-8" />

			<div
				className="theme-light:bg-gray-100 theme-dark:bg-gray-900 text-blue-900"
				data-testid="theme-container">
				<button
					type="button"
					onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
					className="border-2 border-red-500"
					data-testid="theme-toggle">
					Toggle Theme
				</button>
				<div className="theme-light:bg-gray-100 theme-dark:bg-gray-900">
					Theme: <span className="theme-dark:block hidden">Dark</span> <span className="theme-light:block hidden">Light</span>
				</div>
			</div>

			<hr />

			<div
				className="theme-2-light:bg-gray-100 theme-2-dark:bg-gray-900"
				data-testid="theme-container-secondary">
				<button
					type="button"
					onClick={() => setTheme2(prev => (prev === 'light' ? 'dark' : 'light'))}
					className="border-2 border-red-500"
					data-testid="theme-toggle-secondary">
					Toggle Theme Secondary
				</button>
				<div className="theme-2-light:bg-gray-100 theme-2-dark:bg-gray-900">
					Theme: <span className="theme-2-dark:block hidden">Dark</span> <span className="theme-2-light:block hidden">Light</span>
				</div>
			</div>

			<hr />

			<div
				className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900"
				data-testid="theme-container-3">
				<button
					type="button"
					onClick={() => setThemeThree(prev => (prev === 'light' ? 'dark' : 'light'))}
					className="border-2 border-red-500"
					data-testid="theme-toggle-3">
					Toggle Theme 3
				</button>
				<div className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900">
					Theme: <span className="theme-three-dark:block hidden">Dark</span> <span className="theme-three-light:block hidden">Light</span>
				</div>
			</div>
		</>
	);
}
