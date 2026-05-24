"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

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
		<RenderChip
			className={[flashing ? "bg-violet-200" : "", className].join(" ")}
			style={!flashing ? { backgroundColor: "var(--color-violet-700)", color: "white" } : undefined}>
			Renders: {count}
		</RenderChip>
	);
}

export function RenderChip({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
	return (
		<div
			className={["px-2.5 w-fit py-1 font-mono text-sm font-bold leading-none text-black transition-none", className].join(" ")}
			style={style}
			suppressHydrationWarning>
			{children}
		</div>
	);
}
