import { bodyAttributes } from '@zero-ui/attributes';
import './globals.css';

import ZeroUiRuntime from './zero-runtime';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				{...bodyAttributes}
				className="bg-red test-ww this is to test the body tag"
				id="88">
				<ZeroUiRuntime />
				{children}
			</body>
		</html>
	);
}
