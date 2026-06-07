import type { ReactNode } from "react";
import { ArrowRight, Github, Globe, Package } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";
import { CopyCommand } from "./CopyCommand";

type FooterCtaLink = { label: string; href: string; external?: boolean };

type FooterCtaContent = {
	title: string;
	body: string;
	command: string;
	commandLabel: string;
	primaryLink: FooterCtaLink;
	secondaryLink: FooterCtaLink;
	commandClassName?: string;
};

const defaultFooterCta: FooterCtaContent = {
	title: "Get Started",
	body: "Run the CLI to initialize React Zero-UI in under a minute and move your presentation state out of React.",
	command: "npx create-zero-ui",
	commandLabel: "Copy install command",
	primaryLink: { label: "Read the Docs", href: "/docs" },
	secondaryLink: { label: "Demo", href: "/demo/real-world" },
};

export const iconSpriteFooterCta: FooterCtaContent = {
	title: "Ship smaller React icon HTML",
	body: "Use Lucide and Tabler icons like React components, then compile only the icons you use into one cached SVG sprite.",
	command: "npm i @react-zero-ui/icon-sprite",
	commandLabel: "Copy install command",
	commandClassName: "max-sm:text-xs",
	primaryLink: { label: "Read the README", href: "https://github.com/react-zero-ui/icon-sprite#readme", external: true },
	secondaryLink: { label: "View on npm", href: "https://www.npmjs.com/package/@react-zero-ui/icon-sprite", external: true },
};

export function Footer({ cta = defaultFooterCta }: { cta?: FooterCtaContent }) {
	return (
		<footer className="mt-12 bg-fd-background">
			<CallToAction cta={cta} />
			<div className="mx-auto w-full max-w-5xl px-6 pb-10">
				<LinkColumns />
				<BottomBar />
			</div>
		</footer>
	);
}

function CallToAction({ cta }: { cta: FooterCtaContent }) {
	return (
		<div className="border-fd-border bg-fd-muted/40 relative overflow-hidden border-y flex flex-col items-center justify-between">
			<div
				aria-hidden="true"
				className="bg-fd-primary/10 absolute -top-32 left-1/2 h-56 w-160 -translate-x-1/2 rounded-full blur-3xl"
			/>
			<div className="relative mx-auto flex w-full max-w-5xl px-6 py-12 text-center flex-col items-center ">
				<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl mb-3">{cta.title}</h2>
				<p className="text-fd-muted-foreground text-sm max-w-lg mb-5">{cta.body}</p>

				<CopyCommand
					command={cta.command}
					className={cta.commandClassName}
					label={cta.commandLabel}
				/>

				<div className="flex text-nowrap items-center justify-center gap-3">
					<CtaLink
						link={cta.primaryLink}
						className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors max-sm:text-xs"
					/>
					<CtaLink
						link={cta.secondaryLink}
						className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors max-sm:text-xs"
					/>
				</div>
			</div>
		</div>
	);
}

function CtaLink({ link, className }: { link: FooterCtaLink; className: string }) {
	const children = (
		<>
			{link.label} <ArrowRight className="h-4 w-4" />
		</>
	);

	if (link.external) {
		return (
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer nofollow"
				className={className}>
				{children}
			</a>
		);
	}

	return (
		<Link
			href={link.href}
			className={className}>
			{children}
		</Link>
	);
}

function LinkColumns() {
	return (
		<div className="grid gap-8 pt-10 sm:grid-cols-3">
			<div>
				<Logo className="mb-2" />
				<p className="text-fd-muted-foreground text-md font-medium">Open source. Tiny. Tested.</p>
			</div>
			<FooterColumn
				heading="Docs"
				links={[
					{ label: "Get Started", href: "/docs/getting-started" },
					{ label: "API Reference", href: "/docs/api-reference" },
					{ label: "Usage Examples", href: "/docs/usage-examples" },
					{ label: "FAQ", href: "/docs/faq" },
				]}
			/>
			<FooterColumn
				heading="Community"
				links={[
					{ label: "GitHub", href: "https://github.com/react-zero-ui/core", external: true, icon: <Github className="h-3.5 w-3.5" /> },
					{ label: "npm", href: "https://www.npmjs.com/package/@react-zero-ui/core", external: true, icon: <Package className="h-3.5 w-3.5" /> },
					{ label: "Demo", href: "/demo/real-world", icon: <Globe className="h-3.5 w-3.5" /> },
					{ label: "Icon Sprite", href: "/icon-sprite", icon: <Package className="h-3.5 w-3.5" /> },
				]}
			/>
		</div>
	);
}

function FooterColumn({ heading, links }: { heading: string; links: { label: string; href: string; external?: boolean; icon?: ReactNode }[] }) {
	return (
		<div>
			<div className="mb-3 text-sm font-semibold">{heading}</div>
			<ul className="space-y-2">
				{links.map((link) =>
					link.external ? (
						<li key={link.href}>
							<a
								href={link.href}
								target="_blank"
								rel="nofollow noopener noreferrer"
								className="text-fd-muted-foreground hover:text-fd-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
								{link.icon}
								{link.label}
							</a>
						</li>
					) : (
						<li key={link.href}>
							<Link
								href={link.href}
								className="text-fd-muted-foreground hover:text-fd-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
								{link.icon}
								{link.label}
							</Link>
						</li>
					)
				)}
			</ul>
		</div>
	);
}

function BottomBar() {
	return (
		<div className="border-fd-border text-fd-muted-foreground mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs sm:flex-row">
			<div>© {new Date().getFullYear()} React Zero-UI · MIT licensed</div>
			<a
				href="https://www.serbyte.net/"
				target="_blank"
				rel="noopener noreferrer"
				className="hover:text-fd-foreground transition-colors">
				Built by Serbyte Web Design &amp; Development
			</a>
		</div>
	);
}
