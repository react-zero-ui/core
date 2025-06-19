import { RenderTracker } from './ReactTracker';

const layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative">
      {children}
      <RenderTracker />
      <div className="fixed right-0 bottom-0 z-10 h-fit w-full rounded-lg border-t border-gray-200 bg-white px-4 py-2">
        <span className="absolute -top-6 left-2 text-sm text-gray-500">Layout.tsx (Global State Access)</span>
        <div className="text-sm text-blue-500">Global UI State Variables</div>
        <div className="active-zero:hidden text-sm text-gray-500">None</div>
        <div className="active-react:hidden text-sm text-gray-500">
          <span className="theme-light:hidden">theme-dark</span>
          <span className="theme-dark:hidden">theme-light</span>
          <span className="accent-violet:block accent-violet:text-violet-500 hidden">accent-violet</span>
          <span className="accent-emerald:block accent-emerald:text-emerald-500 hidden">accent-emerald</span>
          <span className="accent-amber:block accent-amber:text-amber-500 hidden">accent-amber</span>
          <span className="menu-open-true:hidden">menu-open-true</span>
          <span className="menu-open-false:hidden">menu-open-false</span>
          <span className=":hidden"> </span>
        </div>
      </div>
    </div>
  );
};

export default layout;
