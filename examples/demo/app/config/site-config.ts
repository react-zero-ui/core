export const DOMAIN_URL = process.env.NODE_ENV === "production" ? "https://zero-ui.dev" : "http://localhost:3000";

export const SITE_CONFIG = {
	// This information is also used in the metadata for the home page and schema
	title: "React Zero-UI",
	description: "Ultra-fast React UI state management with zero runtime, zero React re-renders, and generated Tailwind variants.",
} as const;

export const SITE_NAP = {
	name: "React Zero-UI",
	nameSlug: "react-zero-ui",
	legalName: "React Zero-UI",
	alternateNames: ["Zero-UI", "zero-ui", "zeroui", "@react-zero-ui/core"],
	googleBusinessType: "SoftwareApplication" as const,
	contact: "Austin Serb",
	contactTitle: "Creator",
	areasServed: ["United States", "Worldwide"],
	profiles: {
		github: "https://github.com/react-zero-ui/core",
		npm: "https://www.npmjs.com/package/@react-zero-ui/core",
		creator: "https://github.com/austin1serb",
		sponsor: "https://www.serbyte.net/",
	} as const,
	logo: DOMAIN_URL + "/assets/zero-ui-logo.png",
	favicon: DOMAIN_URL + "/assets/zero-ui-favicon.png",
	images: [DOMAIN_URL + "/assets/zero-ui-logo.png"],
} as const;

export const SITE_SLUGS = {
	home: "/",
	realWorldDemo: "/demo/real-world",
	docs: {
		index: "/docs",
		apiReference: "/docs/api-reference",
		usageExamples: "/docs/usage-examples",
		migrationGuide: "/docs/migration-guide",
		experimental: "/docs/experimental",
		faq: "/docs/faq",
		next: "/docs/getting-started/next",
		vite: "/docs/getting-started/vite",
	},
} as const;

const flattenSlugs = (obj: Record<string, string | Record<string, string>>): string[] => {
	return Object.values(obj).flatMap((value) => (typeof value === "string" ? [value] : flattenSlugs(value)));
};

export const ALL_PAGES: string[] = Object.values(SITE_SLUGS).flatMap((value) => (typeof value === "string" ? [value] : flattenSlugs(value)));
