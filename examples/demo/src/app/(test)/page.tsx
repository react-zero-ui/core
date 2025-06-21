'use client';

import { Icon } from '@/app/components/Icon';
import { TestComponentWithState } from './ReactState';
import { TestComponent } from './ZeroState';
import { useUI } from '@austinserb/react-zero-ui';

export default function Page() {
  const [, setActive] = useUI<'react' | 'zero'>('active', 'zero');

  return (
    <div className="mx-auto flex min-h-[100dvh] items-center justify-center  bg-gray-100">
      <div className="min-h-[750px] w-full" >
        <div className="mx-auto flex w-full max-w-xl flex-col rounded-lg p-5 shadow-lg ">
          {/* Button Header */}
          <div className="relative flex overflow-hidden rounded-t-lg border border-gray-200 text-white">
            {/* Sliding Indicator */}
  
            <div className="active-zero:left-0 active-react:left-1/2 active-zero:bg-gradient-to-r active-zero:from-purple-600 active-zero:to-blue-600 active-react:bg-gradient-to-l active-react:from-[#58C4E0] active-react:to-blue-500 absolute bottom-0 left-0 z-0 h-full w-1/2 rounded-t-lg transition-all duration-300" />
            {/* Buttons */}
            <button
              onClick={() => setActive('zero')}
              className="active-zero:text-white relative z-2 flex-1 rounded-tl-lg px-6 py-4 font-semibold text-gray-600 transition-colors duration-300"
            >
              ⚡ Zero UI
            </button>
            <button
              onClick={() => setActive('react')}
              className="active-react:text-white relative z-2 flex flex-1 items-center justify-center gap-2 rounded-tr-lg px-6 py-4 font-semibold text-gray-600 transition-colors duration-300"
            >
              <Icon
                name="react"
                className="active-react:invert active-zero:invert-50 h-5 w-5"
              />{' '}
              React State
            </button>
          </div>
  
          <div className="h-full  w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-200">
            <div className="active-zero:translate-x-0 active-react:translate-x-[-50%] grid h-full w-[200%] grid-cols-2 items-center justify-start transition-transform duration-300">
              <TestComponent />
              <TestComponentWithState />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
