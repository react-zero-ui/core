import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import { bodyAttributes } from '@zero-ui/attributes';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen" {...bodyAttributes}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
