import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { cn } from "fumadocs-ui/utils/cn";
import { BookOpen, Github } from "lucide-react";
import { SITE_NAP } from "@/app/config/site-config";
import { SearchToggle } from "fumadocs-ui/components/layout/search-toggle";
import { Logo } from "@/app/(home)/_components/Logo";

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
		nav: { title: <Logo /> },

		// override the search toggle to add a GitHub link to the mobile menu
		searchToggle: { components: { sm: <MobileGitHubLink /> } },
		links: [
			{ type: "custom", on: "menu", secondary: true, children: <SearchToggle hideIfDisabled /> },
			{ icon: <BookOpen />, text: "Docs", url: "/docs" },
			{ type: "icon", icon: <Github />, text: "GitHub", label: "GitHub", url: SITE_NAP.profiles.github, external: true, on: "nav" },
		],
	};
}
