'use client';

import useUI from '@austinserb/react-zero-ui';
import AutoThemeComponent from './AutoThemeComponent';

export default function Page() {
	const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
	const [, setTheme2] = useUI<'light' | 'dark'>('theme-2', 'light');
	const [, setThemeThree] = useUI<'light' | 'dark'>('themeThree', 'light');
	return (
		<>
			{/* Auto Theme Component  */}
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
