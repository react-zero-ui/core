import { domAnimation, LazyMotion } from 'motion/react';

const layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<div className="relative py-10">
			<LazyMotion features={domAnimation}>{children}</LazyMotion>

			<div className="fixed right-0 bottom-0 z-10 h-fit w-full rounded-lg bg-white/80 px-4 py-2 ring-1 ring-black/5 backdrop-blur-sm md:bg-white/20">
				<div className="pb-2 text-sm text-blue-500">(Layout.tsx) Global UI State Variables</div>
				<div className="active-zero:hidden text-sm text-gray-600">None</div>
				<div className="active-react:hidden flex flex-wrap gap-1 text-sm md:max-w-1/2 md:gap-2">
					<div className="w-40 overflow-hidden md:w-43">
						<div className="theme-dark:translate-x-0 theme-light:translate-x-[-50%] grid w-[200%] grid-cols-2 transition-transform duration-300">
							<div className="pill theme-dark:opacity-100 theme-light:opacity-0 theme-dark:scale-100 theme-light:scale-50 duration-300 ease-in">theme-dark</div>
							<div className="pill theme-dark:opacity-0 theme-light:opacity-100 theme-dark:scale-50 theme-light:scale-100 duration-300 ease-in">
								theme-light
							</div>
						</div>
					</div>
					<div className="w-40 overflow-hidden md:w-43">
						<div className="accent-violet:translate-x-0 accent-emerald:translate-x-[-33.33%] accent-amber:translate-x-[-66.67%] grid w-[300%] grid-cols-3 transition-transform duration-300">
							<div className="accent-violet:text-violet-500 pill accent-violet:scale-100 accent-violet:opacity-100 scale-50 opacity-0 duration-300 ease-in">
								accent-violet
							</div>
							<div className="accent-emerald:text-emerald-500 pill accent-emerald:scale-100 accent-emerald:opacity-100 scale-50 opacity-0 duration-300 ease-in">
								accent-emerald
							</div>
							<div className="accent-amber:text-amber-500 pill accent-amber:scale-100 accent-amber:opacity-100 scale-50 opacity-0 duration-300 ease-in">
								accent-amber
							</div>
						</div>
					</div>
					<div className="w-40 overflow-hidden md:w-43">
						<div className="menu-open-true:translate-x-0 menu-open-false:translate-x-[-50%] grid w-[200%] grid-cols-2 transition-transform duration-300">
							<div className="pill menu-open-true:opacity-100 menu-open-false:opacity-0 menu-open-true:scale-100 menu-open-false:scale-50 duration-300 ease-in">
								menu-open-true
							</div>
							<div className="pill menu-open-true:opacity-0 menu-open-false:opacity-100 menu-open-true:scale-50 menu-open-false:scale-100 duration-300 ease-in">
								menu-open-false
							</div>
						</div>
					</div>
					<div className="w-40 overflow-hidden md:w-43">
						<div className="scrolled-up:translate-x-0 scrolled-down:translate-x-[-50%] grid w-[200%] grid-cols-2 transition-transform duration-300">
							<div className="pill scrolled-up:opacity-100 scrolled-down:opacity-0 scrolled-up:scale-100 scrolled-down:scale-50 duration-300 ease-in">
								scrolled-up
							</div>
							<div className="pill scrolled-up:opacity-0 scrolled-down:opacity-100 scrolled-up:scale-50 scrolled-down:scale-100 duration-300 ease-in">
								scrolled-down
							</div>
						</div>
					</div>
					<div className="w-40 overflow-hidden md:hidden md:w-43">
						<div className="mobile-menu-open:translate-x-[-50%] mobile-menu-closed:translate-x-0 grid w-[200%] grid-cols-2 transition-transform duration-300">
							<div className="pill mobile-menu-open:opacity-0 mobile-menu-closed:opacity-100 mobile-menu-open:scale-50 duration-300 ease-in">
								mobile-menu-closed
							</div>
							<div className="pill mobile-menu-open:opacity-100 mobile-menu-closed:scale-50 mobile-menu-closed:opacity-0 duration-300 ease-in">
								mobile-menu-open
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default layout;
