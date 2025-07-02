/* eslint-disable import/no-unresolved */
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
