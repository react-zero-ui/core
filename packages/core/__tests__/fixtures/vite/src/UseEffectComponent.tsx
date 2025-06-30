'use client';
import { useEffect, useState } from 'react';
import { useUI } from '@react-zero-ui/core';

// Component that automatically cycles through themes using useEffect
export default function UseEffectComponent() {
	const [, setAutoTheme] = useUI<'light' | 'dark'>('use-effect-theme', 'light');
	const [state, setState] = useState(false);

	useEffect(() => {
		setAutoTheme(state ? 'dark' : 'light');
	}, [state]);

	return (
		<div
			className="use-effect-theme-light:bg-gray-100 use-effect-theme-dark:bg-gray-900 use-effect-theme-dark:text-white"
			data-testid="use-effect-theme-container">
			<button
				className="border-2"
				onClick={() => setState((prev) => !prev)}
				data-testid="use-effect-theme">
				Toggle Theme (useEffect on click)
			</button>
			<div className="use-effect-theme-light:bg-gray-100 use-effect-theme-dark:bg-gray-900">
				Theme: <span className="use-effect-theme-dark:block hidden">Dark</span> <span className="use-effect-theme-light:block hidden">Light</span>
			</div>
		</div>
	);
}
