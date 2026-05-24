import { ArrowRight, Github, Globe, Package } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";
import { CopyCommand } from "./CopyCommand";

export function Footer() {
	return (
		<footer className="mt-12 bg-fd-background">
			<CallToAction />
			<div className="mx-auto w-full max-w-5xl px-6 pb-10">
				<LinkColumns />
				<BottomBar />
			</div>
		</footer>
	);
}

function CallToAction() {
	return (
		<div className="border-fd-border bg-fd-muted/40 relative overflow-hidden border-y flex flex-col items-center justify-between">
			<div
				aria-hidden="true"
				className="bg-fd-primary/10 absolute -top-32 left-1/2 h-56 w-160 -translate-x-1/2 rounded-full blur-3xl"
			/>
			<div className="relative mx-auto flex w-full max-w-5xl px-6 py-12 text-center flex-col items-center ">
				<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl mb-3">Get Started</h2>
				<p className="text-fd-muted-foreground text-sm max-w-lg mb-5">
					Run the CLI to initialize React Zero-UI in under a minute and move your presentation state out of React.
				</p>

				<CopyCommand
					command="npx create-zero-ui"
					label="Copy install command"
				/>

				<div className="flex flex-wrap items-center justify-center gap-3">
					<Link
						href="/docs"
						className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors">
						Read the Docs <ArrowRight className="h-4 w-4" />
					</Link>
					<Link
						href="/demo/real-world"
						className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors">
						Demo <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</div>
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
				]}
			/>
		</div>
	);
}

function FooterColumn({ heading, links }: { heading: string; links: { label: string; href: string; external?: boolean; icon?: React.ReactNode }[] }) {
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
