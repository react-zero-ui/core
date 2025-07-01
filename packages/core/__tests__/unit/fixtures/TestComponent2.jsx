import { useUI } from '@react-zero-ui/core';

const Component = () => {
	const [, setTheme] = useUI('theme', 'light');
	const [, setSize] = useUI('size', 'medium');
	return <div></div>;
};

export default Component;
