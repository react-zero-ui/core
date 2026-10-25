import { bodyAttributes } from "@zero-ui/attributes";
import localFont from "next/font/local";
import "./globals.css";

import ZeroUiRuntime from "./zero-runtime";

const testFont = localFont({
	src: "./fonts/geist-latin.woff2",
	variable: "--font-test",
	display: "swap",
	style: "normal",
});

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				{...bodyAttributes}
				className={`${testFont.variable} bg-red test-ww this is to test the body tag`}
				id="88">
				<ZeroUiRuntime />
				{children}
			</body>
		</html>
	);
}
