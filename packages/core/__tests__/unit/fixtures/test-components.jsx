/* eslint-disable import/no-unresolved */
import { useUI } from '@react-zero-ui/core';
import { THEME, MENU_SIZES, VARS } from './variables';

export function ComponentImports() {
	const [, setTheme] = useUI(VARS, THEME);
	const [, setSize] = useUI('size', MENU_SIZES.medium);

	return (
		<div>
			<button onClick={() => setTheme(THEME)}>setTheme</button>
			<button onClick={() => setSize(MENU_SIZES.large)}>setSize</button>
		</div>
	);
}

export function ComponentSimple() {
	const [, setTheme] = useUI('theme', 'light');
	const [, setSize] = useUI('size', 'medium');
	return (
		<div>
			<button onClick={() => setTheme('dark')}>setTheme</button>
			<button onClick={() => setSize('large')}>setSize</button>
		</div>
	);
}
