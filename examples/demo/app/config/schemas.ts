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
	...(SITE_NAP.email ? { email: SITE_NAP.email } : {}),
	...(SITE_NAP.phone ? { telephone: SITE_NAP.phone } : {}),
	...(SITE_NAP.address
		? {
				address: {
					"@type": "PostalAddress",
					streetAddress: SITE_NAP.address,
					addressLocality: SITE_NAP.city,
					addressRegion: SITE_NAP.stateCode,
					postalCode: SITE_NAP.zipCode,
					addressCountry: "US",
				},
			}
		: {}),
	...(sameAs.length ? { sameAs } : {}),
	...(SITE_NAP.email || SITE_NAP.phone
		? {
				contactPoint: [
					{
						"@type": "ContactPoint",
						contactType: "customer service",
						...(SITE_NAP.email ? { email: SITE_NAP.email } : {}),
						...(SITE_NAP.phone ? { telephone: SITE_NAP.phone } : {}),
						availableLanguage: ["English"],
					},
				],
			}
		: {}),
};

/** Combined graph with all schemas - use this in your layout.tsx */
export const siteGraph = {
	"@context": "https://schema.org",
	"@graph": [
		{ ...organizationSchema, "@context": undefined },
		{ ...websiteSchema, "@context": undefined },
	],
};
