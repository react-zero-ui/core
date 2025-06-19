import { Dashboard } from './Dashboard';

export default function Page() {
  return (
    <div className="flex flex-col items-center">
   <div className="p-2.5" >
      <h1 className="text-3xl font-bold text-gray-900 mb-4 pt-10">React State Demo</h1>
        <p className="text-gray-500 mb-4">
          The fastest way to see the lag is to just toggle the button really fast.
        </p>
   </div>
      <Dashboard />
    </div>
  );
}
