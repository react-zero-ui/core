import "./globals.css";
import { bodyAttributes } from "@zero-ui/attributes";

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body {...bodyAttributes}>{children}</body>
		</html>
	);
}
