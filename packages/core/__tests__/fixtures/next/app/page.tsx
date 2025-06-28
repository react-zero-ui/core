'use client';

import useUI from '@austinserb/react-zero-ui';
import UseEffectComponent from './UseEffectComponent';

export default function Page() {
	const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
	const [, setTheme2] = useUI<'light' | 'dark'>('theme-2', 'light');
	const [, setThemeThree] = useUI<'light' | 'dark'>('themeThree', 'light');
	const [, setToggle] = useUI<boolean>('toggle-boolean', true);
	const [, setNumber] = useUI<1 | 2>('number', 1);
	return (
		<div className="m-8 space-y4 border-2">
			{/* Auto Theme Component  */}
			<UseEffectComponent />

			<hr className="my-8" />

			<div
				className="theme-light:bg-gray-100 theme-dark:bg-gray-900 theme-dark:text-white"
				data-testid="theme-container">
				<button
					type="button"
					onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
					className="border-2 border-red-500"
					data-testid="theme-toggle">
					Toggle Theme (default)
				</button>
				<div className="theme-light:bg-gray-100 theme-dark:bg-gray-900">
					Theme: <span className="theme-dark:block hidden">Dark</span> <span className="theme-light:block hidden">Light</span>
				</div>
			</div>

			<hr />

			<div
				className="theme-2-light:bg-gray-100 theme-2-dark:bg-gray-900 theme-2-dark:text-white"
				data-testid="theme-container-secondary">
				<button
					type="button"
					onClick={() => setTheme2((prev) => (prev === 'light' ? 'dark' : 'light'))}
					className="border-2 border-red-500"
					data-testid="theme-toggle-secondary">
					Toggle Theme Secondary (w/ number)
				</button>
				<div className="theme-2-light:bg-gray-100 theme-2-dark:bg-gray-900">
					Theme: <span className="theme-2-dark:block hidden">Dark</span> <span className="theme-2-light:block hidden">Light</span>
				</div>
			</div>

			<hr />

			<div
				className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900 theme-three-dark:text-white"
				data-testid="theme-container-3">
				<button
					type="button"
					onClick={() => setThemeThree((prev) => (prev === 'light' ? 'dark' : 'light'))}
					className="border-2 border-red-500"
					data-testid="theme-toggle-3">
					Toggle Theme 3 (w/ camelCase)
				</button>
				<div className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900">
					Theme: <span className="theme-three-dark:block hidden">Dark</span> <span className="theme-three-light:block hidden">Light</span>
				</div>
			</div>

			<hr />

			<div
				className="toggle-boolean-true:bg-gray-100 toggle-boolean-false:bg-gray-900 toggle-boolean-false:text-white"
				data-testid="theme-container-3">
				<button
					type="button"
					onClick={() => setToggle((prev) => !prev)}
					className="border-2 border-red-500"
					data-testid="toggle-boolean">
					Toggle Boolean ({`w/ boolean + prev => !prev`})
				</button>
				<div className="toggle-boolean-true:bg-gray-100 toggle-boolean-false:bg-gray-900">
					Boolean: <span className="toggle-boolean-true:block hidden">True</span> <span className="toggle-boolean-false:block hidden">False</span>
				</div>
			</div>
			<hr />

			<div
				className="number-1:bg-gray-100 number-2:bg-gray-900 number-2:text-white"
				data-testid="number-container">
				<button
					type="button"
					onClick={() => setNumber((prev) => (prev === 1 ? 2 : 1))}
					className="border-2 border-red-500"
					data-testid="toggle-number">
					Toggle Number ({`w/ number + prev => prev === 1 ? 2 : 1`})
				</button>
				<div className="number-1:bg-gray-100 number-2:bg-gray-900">
					Number: <span className="number-1:block hidden">1</span> <span className="number-2:block hidden">2</span>
				</div>
			</div>
		</div>
	);
}
