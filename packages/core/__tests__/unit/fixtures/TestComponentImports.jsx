import { useUI } from '@react-zero-ui/core';
import { THEME, MENU_SIZES, VARS } from './variables';

const Component = () => {
	const [, setTheme] = useUI(VARS, THEME);
	const [, setSize] = useUI('size', MENU_SIZES.medium);

	return (
		<div>
			<button onClick={() => setTheme(THEME)}>setTheme</button>
			<button onClick={() => setSize(MENU_SIZES.large)}>setSize</button>
		</div>
	);
};

export default Component;
