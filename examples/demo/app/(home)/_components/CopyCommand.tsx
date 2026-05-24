"use client";

import { Check, Clipboard } from "lucide-react";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";

type CopyCommandProps = { command: string; label?: string; className?: string };

export function CopyCommand({ command, label = "Copy command", className = "" }: CopyCommandProps) {
	const [checked, onClick] = useCopyButton(() => {
		return navigator.clipboard.writeText(command);
	});

	return (
		<button
			type="button"
			onClick={onClick}
			className={[
				"mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border bg-fd-card px-4 py-2 font-mono text-sm transition-colors hover:bg-fd-accent",
				className,
			].join(" ")}
			aria-label={checked ? "Copied command" : label}>
			<span className="text-fd-muted-foreground">$</span>
			<span>{command}</span>
			{checked ? <Check className="size-3.5" /> : <Clipboard className="size-3.5 text-fd-muted-foreground" />}
		</button>
	);
}
