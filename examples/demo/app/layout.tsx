import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter_Tight } from "next/font/google";
import { bodyAttributes } from "@zero-ui/attributes";
import { DOMAIN_URL, SITE_CONFIG, SITE_NAP } from "./config/site-config";
import { siteGraph } from "./config/schemas";

const inter = Inter_Tight({ subsets: ["latin"] });

export const metadata = {
	metadataBase: new URL(DOMAIN_URL),
	title: { default: SITE_CONFIG.title },
	description: SITE_CONFIG.description,
	openGraph: {
		title: SITE_CONFIG.title,
		description: SITE_CONFIG.description,
		url: DOMAIN_URL,
		siteName: "React Zero-UI",
		type: "website",
		images: SITE_NAP.images,
	},
	twitter: { card: "summary_large_image", title: SITE_CONFIG.title, description: SITE_CONFIG.description, images: SITE_NAP.images },
};

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			suppressHydrationWarning>
			<body
				className={`flex subpixel-antialiased flex-col ${inter.className}`}
				{...bodyAttributes}>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph) }}
				/>
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
