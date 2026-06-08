import type { ComponentType, CSSProperties } from "react";
import {
	Activity,
	Airplay,
	AlarmClock,
	Archive,
	BadgeCheck,
	Bell,
	Calendar,
	CheckCircle,
	Code,
	Download,
	GitBranch,
	GitMerge,
	GitPullRequest,
	Heart,
	IconBrandGithub,
	IconBrandTabler,
	IconHeart,
	Mail,
	Package,
	Rocket,
	Search,
	Settings,
	Sparkles,
	Zap,
} from "@react-zero-ui/icon-sprite";

export type IconComponent = ComponentType<{ size?: number; className?: string; width?: number; height?: number; strokeWidth?: number }>;

export const sampleIcons: IconComponent[] = [
	Activity,
	Airplay,
	AlarmClock,
	Archive,
	BadgeCheck,
	Bell,
	Calendar,
	CheckCircle,
	Code,
	Download,
	GitBranch,
	GitMerge,
	GitPullRequest,
	Heart,
	IconBrandGithub,
	IconBrandTabler,
	IconHeart,
	Mail,
	Package,
	Rocket,
	Search,
	Settings,
	Sparkles,
	Zap,
];

const heroIcons: IconComponent[] = Array.from({ length: 140 }, (_, index) => sampleIcons[index % sampleIcons.length]);

const iconSpotlight: CSSProperties = {
	WebkitMaskImage: "radial-gradient(circle 180px at var(--x, 50%) var(--y, 50%), #000 0%, transparent 70%)",
	maskImage: "radial-gradient(circle 180px at var(--x, 50%) var(--y, 50%), #000 0%, transparent 70%)",
};

export function HeroIconBackdrop() {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
			<div className="absolute inset-y-0 left-[42%] right-[-18%] hidden md:block">
				<IconGrid className="absolute inset-0 dark:text-fd-foreground/5 text-fd-foreground/8" />
				<IconGrid
					className="icon-spotlight-drift absolute inset-0 text-fd-primary/35"
					style={iconSpotlight}
				/>
			</div>
			<div className="absolute inset-x-[-18%] bottom-[-24%] top-[34%] md:hidden">
				<IconGrid className="absolute inset-0 text-fd-foreground/3" />
				<IconGrid
					className="icon-spotlight-drift absolute inset-0 text-fd-primary/25"
					style={iconSpotlight}
				/>
			</div>
		</div>
	);
}

function IconGrid({ className, style }: { className?: string; style?: CSSProperties }) {
	return (
		<div
			className={`grid h-full w-full grid-cols-[repeat(auto-fill,minmax(76px,1fr))] content-start ${className ?? ""}`}
			style={style}>
			{heroIcons.map((Icon, index) => (
				<span
					key={index}
					className="flex aspect-square items-center justify-center border-[0.5px] border-fd-border/10">
					<Icon
						size={34}
						strokeWidth={1}
					/>
				</span>
			))}
		</div>
	);
}
