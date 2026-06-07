import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { DOMAIN_URL, SITE_SLUGS } from "./config/site-config";

const staticRoutes = [SITE_SLUGS.home, SITE_SLUGS.realWorldDemo, SITE_SLUGS.iconSprite];

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date().toISOString();

	const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
		url: `${DOMAIN_URL}${path}`,
		lastModified: now,
		changeFrequency: path === "/" ? "weekly" : "monthly",
		priority: path === "/" ? 1 : 0.7,
	}));

	const docEntries: MetadataRoute.Sitemap = source
		.getPages()
		.map((page) => ({ url: `${DOMAIN_URL}${page.url}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }));

	return [...staticEntries, ...docEntries];
}
