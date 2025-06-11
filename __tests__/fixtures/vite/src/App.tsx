"use client";
import { useUI } from "@austinserb/react-zero-ui";
import "./App.css";

const App: React.FC = () => {
	const [theme, setTheme] = useUI<"light" | "dark">("theme", "light");

	return (
		<div
			data-testid="theme-container"
			className="theme-light:bg-gray-100 theme-dark:bg-gray-900 theme-dark:text-white min-h-screen flex flex-col items-center justify-center gap-4"
		>
			<button
				data-testid="theme-toggle"
				onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
				className="px-4 py-2 border rounded bg-primary text-secondary text-nowrap"
			>
				Toggle Theme (<span className="theme-light:inline-block hidden">light</span>
				<span className="theme-dark:inline-block hidden text-white">dark</span>)
			</button>
		</div>
	);
};

export default App;
