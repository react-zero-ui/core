import { bodyAttributes } from '@zero-ui/attributes';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body
				{...bodyAttributes}
				className="bg-red test-ww this is to test the body tag"
				id="88">
				{children}
			</body>
		</html>
	);
}
