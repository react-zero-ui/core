import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";
import { bodyAttributes } from "@zero-ui/attributes";
import { DOMAIN_URL, SITE_CONFIG } from "./config/site-config";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { metadataBase: new URL(DOMAIN_URL), title: { default: SITE_CONFIG.title }, description: SITE_CONFIG.description };

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`flex flex-col min-h-screen ${inter.className}`}
				{...bodyAttributes}>
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
