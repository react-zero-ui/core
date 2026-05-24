import React, { isValidElement, useLayoutEffect, useRef, type ReactNode } from "react";
import { RenderChip } from "./RenderCounter";

export function RenderHighlight({ children, className = "", name }: { children: ReactNode; className?: string; name?: string }) {
	const flashRef = useRef<HTMLDivElement>(null);
	const mounted = useRef(false);

	useLayoutEffect(() => {
		const flash = flashRef.current;
		if (!flash) return;

		if (!mounted.current) {
			mounted.current = true;
			return;
		}

		const animation = flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, fill: "forwards" });

		return () => animation.cancel();
	});

	const childName = name || getChildName(children);

	return (
		<div className={["relative", className].join(" ")}>
			<div
				ref={flashRef}
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-50 rounded-[inherit] border border-violet-500/80 bg-violet-500/10 opacity-0">
				{childName && <RenderChip className="absolute top-0 left-0 text-[10px] bg-violet-700 text-white">{childName}</RenderChip>}
			</div>

			{children}
		</div>
	);
}

function getChildName(children: ReactNode) {
	const child = React.Children.toArray(children).find(isValidElement);

	if (!child || !isValidElement(child)) return null;

	const type = child.type;

	if (typeof type === "string") return type;

	return (type as any).displayName || (type as any).name || "Anonymous";
}
