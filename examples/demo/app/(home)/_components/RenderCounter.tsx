"use client";

import { useEffect, useRef, useState } from "react";

export function RenderCounter({ count, className = "" }: { count: number; className?: string }) {
	const prevCount = useRef(count);
	const [flashing, setFlashing] = useState(false);

	useEffect(() => {
		if (prevCount.current === count) return;

		prevCount.current = count;
		setFlashing(true);

		const timeout = window.setTimeout(() => {
			setFlashing(false);
		}, 180);

		return () => window.clearTimeout(timeout);
	}, [count]);

	return (
		<div
			className={[
				"px-2.5 w-fit py-1 font-mono text-sm font-bold leading-none text-white transition-colors duration-150",
				flashing ? "bg-red-300" : "",
				className,
			].join(" ")}
			style={!flashing ? { backgroundColor: "var(--color-violet-700)" } : undefined}
			suppressHydrationWarning>
			Renders: {count}
		</div>
	);
}
