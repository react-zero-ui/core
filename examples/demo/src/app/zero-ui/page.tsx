import { Dashboard } from './Dashboard';

export const metadata = {
  title: 'Zero UI Demo',
  description: '10,000 live nodes. No virtual DOM. No re-renders. Just raw UI performance.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_URL + '/zero-ui',
  },
};

export default function Page() {
  return (
    <div className="flex flex-col items-center">
      <div className="p-2.5">
         <h1 className="text-3xl font-bold text-gray-900 mb-4 pt-10">Zero UI Demo</h1>
        <p className="text-gray-500 mb-4">
        10,000 live nodes. No virtual DOM. No re-renders. Just raw UI performance.
        </p>
      </div>
      {/* 10k nodes */}
      <Dashboard />
    </div>
  );
}
