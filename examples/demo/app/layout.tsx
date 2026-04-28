import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import { bodyAttributes } from '@zero-ui/attributes';

const inter = Inter({
  subsets: ['latin'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://zero-ui.dev');

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'React Zero-UI',
    template: '%s · React Zero-UI',
  },
  description: 'Ultra-fast React UI state with zero runtime and zero re-renders.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen" {...bodyAttributes}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
