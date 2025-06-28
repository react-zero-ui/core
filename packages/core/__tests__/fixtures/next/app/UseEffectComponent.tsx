'use client';
import { useEffect } from 'react';
import useUI from '@austinserb/react-zero-ui';

// Component that automatically cycles through themes using useEffect
export default function UseEffectComponent() {
	const [, setAutoTheme] = useUI<'light' | 'dark'>('use-effect-theme', 'light');

	useEffect(() => {
		setAutoTheme('dark');
	}, []);

	return (
		<div
			className="use-effect-theme-light:bg-gray-100 use-effect-theme-dark:bg-gray-900 use-effect-theme-dark:text-white"
			data-testid="use-effect-theme-container">
			<div
				className="border-2"
				data-testid="use-effect-theme">
				Toggle Theme (useEffect on mount)
			</div>
			<div className="use-effect-theme-light:bg-gray-100 use-effect-theme-dark:bg-gray-900">
				Theme: <span className="use-effect-theme-dark:block hidden">Dark</span> <span className="use-effect-theme-light:block hidden">Light</span>
			</div>
		</div>
	);
}
