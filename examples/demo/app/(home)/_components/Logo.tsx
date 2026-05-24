import { SITE_NAP } from "@/app/config/site-config";
import Image from "next/image";
import { cn } from "fumadocs-ui/utils/cn";

export function Logo({ className }: { className?: string }) {
	return (
		<span className={cn("font-bold tracking-tight flex items-center gap-2", className)}>
			<Image
				src={"/assets/zero-ui-favicon-transparent.png"}
				alt={SITE_NAP.name}
				width={32}
				height={32}
				className="bg-transparent rounded-lg shadow dark:shadow-white/10"
			/>
			React Zero-UI
		</span>
	);
}
