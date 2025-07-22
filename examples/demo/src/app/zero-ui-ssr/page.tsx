import { Dashboard } from './Dashboard';
import InitZeroUI from './init-zero-ui';

export const metadata = {
	title: 'Zero UI Demo SSR',
	description: '10,000 live nodes. No virtual DOM. No re-renders. Just raw UI performance.',
	alternates: { canonical: process.env.NEXT_PUBLIC_URL + '/zero-ui-ssr' },
};

export default function Page() {
	return (
		<div className="flex flex-col items-center py-10 md:py-20">
			<InitZeroUI />
			<div className="p-2.5">
				<h1 className="mb-4 pt-10 text-3xl font-bold text-gray-900">Zero UI Demo</h1>
				<p className="mb-4 text-gray-500">10,000 live nodes. No virtual DOM. No re-renders. Just raw UI performance.</p>
			</div>
			{/* 10k nodes */}
			<Dashboard />
		</div>
	);
}
