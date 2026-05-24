import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { cn } from "fumadocs-ui/utils/cn";
import { BookOpen, Github } from "lucide-react";
import Image from "next/image";
import { SITE_NAP } from "@/app/config/site-config";

function MobileGitHubLink() {
	return (
		<a
			href={SITE_NAP.profiles.github}
			target="_blank"
			rel="noreferrer"
			aria-label="GitHub"
			className={cn(buttonVariants({ size: "icon-sm", color: "ghost" }), "p-2")}>
			<Github />
		</a>
	);
}

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="font-bold tracking-tight flex items-center gap-2">
					<Image
						src={"/assets/zero-ui-favicon-transparent.png"}
						alt={SITE_NAP.name}
						width={32}
						height={32}
						className="bg-transparent rounded-lg shadow dark:shadow-white/10"
					/>
					React Zero-UI
				</span>
			),
		},
		searchToggle: {
			components: {
				sm: <MobileGitHubLink />,
			},
		},
		links: [
			{ icon: <BookOpen />, text: "Docs", url: "/docs" },
			{ type: "icon", icon: <Github />, text: "GitHub", label: "GitHub", url: SITE_NAP.profiles.github, external: true, on: "nav" },
		],
	};
}
