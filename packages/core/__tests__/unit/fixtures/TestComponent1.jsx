import { useUI } from '@react-zero-ui/core';

const Component = () => {
	const [, setTheme] = useUI('theme', 'light');
	const [, setSize] = useUI('size', 'medium');
	return (
		<div>
			<button onClick={() => setTheme('dark')}>setTheme</button>
			<button onClick={() => setSize('large')}>setSize</button>
		</div>
	);
};

export default Component;
