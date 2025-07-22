import { ReactScan } from './components/ReactScan';
import { bodyAttributes } from '@zero-ui/attributes';
import './globals.css';
import { TopBarV2 } from './components/TopBar';
import { Analytics } from '@vercel/analytics/next';

export const metadata = { title: 'React Zero UI Demo', description: 'React Zero UI Demo', alternates: { canonical: process.env.NEXT_PUBLIC_URL } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body
				className="flex h-full w-full items-center justify-center bg-gray-100 antialiased"
				{...bodyAttributes}>
				<script src="https://unpkg.com/react-scan/dist/auto.global.js" />
				<ReactScan />
				<TopBarV2 />
				{children}
				{process.env.NODE_ENV === 'production' && <Analytics />}
			</body>
		</html>
	);
}
