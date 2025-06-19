import { Dashboard } from './Dashboard';

export const metadata = {
  title: 'React State Demo',
  description: 'React re-renders 10,000 components per toggle. Expect noticeable lag.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_URL + '/react',
  },
};

export default function Page() {

  return (
<div className="flex flex-col items-center">
  <div className="p-2.5">
    <h1 className="text-3xl font-bold text-gray-900 mb-4 pt-10">React State Demo</h1>
    <p className="text-gray-500 mb-4">
    React re-renders 10,000 components per toggle. Expect noticeable lag.
    </p>
  </div>
  <Dashboard />
</div>
  );
}
