import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookOpen, Github } from "lucide-react";
import Image from "next/image";
import { SITE_NAP } from "@/app/config/site-config";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="font-bold tracking-tight flex items-center gap-2">
					<Image
						src={"/assets/zero-ui-favicon.png"}
						alt={SITE_NAP.name}
						width={32}
						height={32}
					/>
					React <span className="text-fd-primary">Zero-UI</span>
				</span>
			),
		},
		links: [
			{ icon: <BookOpen />, text: "Docs", url: "/docs" },
			{ type: "icon", icon: <Github />, text: "GitHub", url: SITE_NAP.profiles.github, external: true },
		],
	};
}
