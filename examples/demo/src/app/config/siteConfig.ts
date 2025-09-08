export const DOMAIN_URL = 'https://zero-ui.dev';

export const SITE_SLUGS = { home: '/', about: '/icon-sprite', contact: '/lucide-react', terms: '/react', privacy: '/ssr', quote: '/zero-ui' } as const;

const flattenSlugs = (obj: Record<string, string | Record<string, string>>): string[] => {
	return Object.values(obj).flatMap((value) => (typeof value === 'string' ? [value] : flattenSlugs(value)));
};

export const ALL_PAGES: string[] = Object.values(SITE_SLUGS).flatMap((value) => (typeof value === 'string' ? [value] : flattenSlugs(value)));
