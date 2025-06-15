"use client";

import useUI from "@austinserb/react-zero-ui";

export default function Page() {
	const [, setTheme] = useUI<"light" | "dark">("theme", "light");

	return (
		<div
			className="theme-light:bg-gray-100 theme-dark:bg-gray-900 text-blue-900"
			data-testid="theme-container"
		>
			<button
				type="button"
				onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
				className="border-2 border-red-500"
				data-testid="theme-toggle"
			>
				Toggle Theme
			</button>
			<div className="theme-light:bg-gray-100 theme-dark:bg-gray-900">
				Theme: <span className="theme-dark:block hidden">Dark</span> <span className="theme-light:block hidden">Light</span>
			</div>
		</div>
	);
}
