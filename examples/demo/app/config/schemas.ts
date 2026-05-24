import type { Organization, WebSite, WithContext } from "schema-dts";
import { DOMAIN_URL, SITE_CONFIG, SITE_NAP } from "./site-config";

const sameAs = Object.values(SITE_NAP.profiles).filter(Boolean);

export const websiteSchema: WithContext<WebSite> = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	"@id": `${DOMAIN_URL}/#website`,
	name: SITE_NAP.name,
	description: SITE_CONFIG.description,
	url: DOMAIN_URL,
	publisher: { "@id": `${DOMAIN_URL}/#organization` },
};

export const organizationSchema: WithContext<Organization> = {
	"@context": "https://schema.org",
	"@type": "Organization",
	"@id": `${DOMAIN_URL}/#organization`,
	name: SITE_NAP.name,
	url: DOMAIN_URL,
	logo: SITE_NAP.logo,
	alternateName: SITE_NAP.alternateNames,

	...(sameAs.length ? { sameAs } : {}),
};

/** Combined graph with all schemas - use this in your layout.tsx */
export const siteGraph = {
	"@context": "https://schema.org",
	"@graph": [
		{ ...organizationSchema, "@context": undefined },
		{ ...websiteSchema, "@context": undefined },
	],
};
