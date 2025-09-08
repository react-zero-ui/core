import { SITE_SLUGS, DOMAIN_URL } from '../app/config/siteConfig';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const flatSlugs = Object.values(SITE_SLUGS).flatMap((val) => (typeof val === 'string' ? [val] : Object.values(val)));

	// Filter out routes that contain hash symbols (scroll links)
	const allRoutes = flatSlugs.filter((route) => typeof route === 'string' && !route.includes('#'));

	return allRoutes.map((url) => ({
		url: DOMAIN_URL + url,
		lastModified: new Date().toISOString(),
		priority: url === '/' ? 1.0 : 0.8,
		changeFrequency: url === '/' ? 'daily' : 'weekly',
	}));
}
