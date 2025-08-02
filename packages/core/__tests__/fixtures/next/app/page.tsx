'use client';
import { cssVar, useScopedUI, useUI } from '@react-zero-ui/core';
import UseEffectComponent from './UseEffectComponent';
import FAQ from './FAQ';
import { ChildComponent } from './ChildComponent';
import { ChildWithoutSetter } from './ChildWithoutSetter';
import CssVarDemo from './CssVarDemo';
 
import { zeroSSR } from '@react-zero-ui/core/experimental';
import ZeroUiRuntime from './zero-runtime';
 

export default function Page() {
	const [scope, setScope] = useScopedUI<'off' | 'on'>('scope', 'off');

	const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
	const [, setTheme2] = useUI<'light' | 'dark'>('theme-2', 'light');
	const [, setThemeThree] = useUI<'light' | 'dark'>('theme-three', 'light');
	const [, setToggle] = useUI<'true' | 'false'>('toggle-boolean', 'true');
	const [, setNumber] = useUI<'1' | '2'>('number', '1');
	const [open, setOpen] = useScopedUI<'open' | 'closed'>('faq', 'closed');
	const [mobile, setMobile] = useScopedUI<'true' | 'false'>('mobile', 'false');
	const [, setChildOpen] = useUI<'open' | 'closed'>('child', 'closed');

	const [, setToggleFunction] = useUI<'white' | 'black'>('toggle-function', 'white');
	const [, setGlobal] = useUI<'0px' | '4px'>('blur-global', '0px', cssVar);


	const toggleFunction = () => {
		setToggleFunction((prev) => (prev === 'white' ? 'black' : 'white'));
	};

	return (
		<div
			className="p-8 theme-light:bg-white theme-dark:bg-white bg-black relative"
			data-testid="page-container">
			<ZeroUiRuntime />
			<h1 className="text-2xl font-bold py-5">Global State</h1>
			<hr />
			<div className=" space-y-4 border-2">
				{/* Auto Theme Component  */}
				<UseEffectComponent />

				<hr className="my-8" />

				<div
					data-theme-ssr="light"
					data-testid="theme-ssr-container"
					className="theme-ssr-dark:bg-gray-900 theme-ssr-light:bg-gray-100 theme-ssr-dark:text-white theme-ssr-light:text-black">
					<button
						data-testid="theme-ssr-toggle"
						className="border-2 border-red-500 theme-ssr-light:text-blue-500 theme-ssr-dark:text-red-500"
						{...zeroSSR.onClick('theme-ssr', ['light', 'dark'])}>
						Toggle SSR SAFE THEME
					</button>
					<div className="flex gap-2">
						Theme:
						<span
							data-testid="theme-ssr-dark"
							className="theme-ssr-dark:block hidden">
							Dark
						</span>
						<span
							data-testid="theme-ssr-light"
							className="theme-ssr-light:block hidden">
							Light
						</span>
					</div>
				</div>
				<hr className="my-8" />

				<div
					className="theme-light:bg-gray-100 theme-dark:bg-gray-900 theme-dark:text-white"
					data-testid="theme-container">
					<button
						type="button"
						onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
						className="border-2 border-red-500"
						data-testid="theme-toggle">
						Toggle Theme (default)
					</button>
					<div className="theme-light:bg-gray-100 theme-dark:bg-gray-900">
						Theme: <span className="theme-dark:block hidden">Dark</span> <span className="theme-light:block hidden">Light</span>
					</div>
				</div>

				<hr />

				<div
					className="theme-2-light:bg-gray-100 theme-2-dark:bg-gray-900 theme-2-dark:text-white"
					data-testid="theme-container-secondary">
					<button
						type="button"
						onClick={() => setTheme2((prev) => (prev === 'light' ? 'dark' : 'light'))}
						className="border-2 border-red-500"
						data-testid="theme-toggle-secondary">
						Toggle Theme Secondary (w/ number in string)
					</button>
					<div className="theme-2-light:bg-gray-100 theme-2-dark:bg-gray-900">
						Theme: <span className="theme-2-dark:block hidden">Dark</span> <span className="theme-2-light:block hidden">Light</span>
					</div>
				</div>

				<hr />

				<div
					className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900 theme-three-dark:text-white"
					data-testid="theme-container-3">
					<button
						type="button"
						onClick={() => setThemeThree((prev) => (prev === 'light' ? 'dark' : 'light'))}
						className="border-2 border-red-500"
						data-testid="theme-toggle-3">
						Toggle Theme 3 (w/ camelCase)
					</button>
					<div className="theme-three-light:bg-gray-100 theme-three-dark:bg-gray-900">
						Theme: <span className="theme-three-dark:block hidden">Dark</span> <span className="theme-three-light:block hidden">Light</span>
					</div>
				</div>

				<hr />

				<div
					className="toggle-boolean-true:bg-gray-100 toggle-boolean-false:bg-gray-900 toggle-boolean-false:text-white"
					data-testid="toggle-boolean-container">
					<button
						type="button"
						onClick={() => setToggle((prev) => (prev === 'true' ? 'false' : 'true'))}
						className="border-2 border-red-500"
						data-testid="toggle-boolean">
						Toggle Boolean ({`w/ boolean + prev => !prev`})
					</button>
					<div className="toggle-boolean-true:bg-gray-100 toggle-boolean-false:bg-gray-900">
						Boolean: <span className="toggle-boolean-true:block hidden">True</span> <span className="toggle-boolean-false:block hidden">False</span>
					</div>
				</div>
				<hr />

				<div
					className="number-1:bg-gray-100 number-2:bg-gray-900 number-2:text-white"
					data-testid="toggle-number-container">
					<button
						type="button"
						onClick={() => setNumber((prev) => (prev === '1' ? '2' : '1'))}
						className="border-2 border-red-500"
						data-testid="toggle-number">
						Toggle Number ({`w/ number + prev => prev === 1 ? 2 : 1`})
					</button>
					<div className="number-1:bg-gray-100 number-2:bg-gray-900">
						Number: <span className="number-1:block hidden">1</span> <span className="number-2:block hidden">2</span>
					</div>
				</div>
				<hr />

				<div
					className="toggle-function-white:bg-gray-100 toggle-function-black:bg-gray-900 toggle-function-black:text-white toggle-function-red:bg-red-500 toggle-function-green:bg-green-500 toggle-function-blue:bg-blue-500"
					data-testid="toggle-function-container">
					<button
						type="button"
						onClick={toggleFunction}
						className="border-2 border-red-500"
						data-testid="toggle-function">
						Toggle Function
					</button>
					<div className="toggle-function-white:bg-gray-100 toggle-function-black:bg-gray-900">
						Function: <span className="toggle-function-white:block hidden">White</span> <span className="toggle-function-black:block hidden">Black</span>
					</div>
				</div>
				<hr />
				<ChildComponent setIsOpen={setChildOpen} />
			</div>
			<hr />

			<h1 className="text-2xl font-bold py-5">Scoped Style Tests</h1>

			<hr />

			<div className="border-2 border-blue-500">
				<div
					className="scope-off:bg-blue-100 scope-on:bg-blue-900 scope-on:text-white"
					data-testid="scope-container"
					//this ref tells the hook to flip the data key here
					data-scope={scope}
					ref={setScope.ref}>
					<button
						type="button"
						onClick={() => setScope((prev) => (prev === 'on' ? 'off' : 'on'))}
						className="border-2 border-red-500"
						data-testid="scope-toggle">
						Toggle Scope
					</button>
					<ChildWithoutSetter />
					<div className="scope-on:bg-blue-900 scope-off:bg-blue-100 ">
						Scope: <span className="scope-off:block scope-on:hidden">False</span>
						<span className="scope-on:block scope-off:hidden">True</span>
					</div>
				</div>

				<hr />

				<div
					className="mobile-false:bg-blue-100 mobile-true:bg-blue-900 mobile-true:text-white"
					data-testid="mobile-container"
					//this ref tells the hook to flip the data key here
					ref={setMobile.ref}
					data-mobile={mobile}>
					<button
						type="button"
						onClick={() => {
							if (typeof window !== 'undefined') {
								if (window.innerWidth > 768) {
									// allow the user to toggle the mobile state
									setMobile((prev) => (prev === 'true' ? 'false' : 'true'));
								}
								if (window.innerWidth < 768) {
									// force the mobile state to false on click
									setMobile('true');
								}
							}
						}}
						className="border-2 border-red-500"
						data-testid="mobile-toggle">
						Toggle Mobile
					</button>
					<div className="mobile-false:bg-blue-100 mobile-true:bg-blue-900 ">
						Mobile: <span className="mobile-false:block mobile-true:hidden">False</span>
						<span className="mobile-true:block mobile-false:hidden">True</span>
					</div>
				</div>
			</div>

			<hr />

			<div
				ref={setOpen.ref}
				data-faq={open}>
				<button
					className="bg-blue-500 text-white p-2 rounded-md m-5"
					onClick={() => setOpen((prev) => (prev === 'open' ? 'closed' : 'open'))}>
					question 0 +
				</button>
				<div className="faq-open:block faq-closed:hidden">answer</div>
			</div>

			<FAQ
				index={1}
				question="Question 1"
				answer="Answer 1"
			/>
			<FAQ
				index={2}
				question="Question 2"
				answer="Answer 2"
			/>
			<FAQ
				index={3}
				question="Question 3"
				answer="Answer 3"
			/>

			{Array.from({ length: 2 }).map((_, index) => (
				<CssVarDemo
					key={index}
					index={index}
				/>
			))}
			<div
				data-testid={`global-blur-container`}
				className="m-4 p-6 rounded bg-slate-200 space-y-3">
				<button
					data-testid={`global-toggle`}
					className="bg-blue-500 text-white p-2 rounded-md"
					onClick={() => setGlobal((prev) => (prev === '0px' ? '4px' : '0px'))}>
					Global blur toggle
				</button>
				<div
					data-testid={`global-blur`}
					className="absolute inset-0 z-10 pointer-events-none"
					style={{ backdropFilter: 'blur(var(--blur-global, 0px))' }} // read the var
				/>
			</div>
		</div>
	);
}
