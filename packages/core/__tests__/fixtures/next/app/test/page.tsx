'use client';
import { useUI, useScopedUI, cssVar } from '@react-zero-ui/core';
import { zeroSSR, scopedZeroSSR } from '@react-zero-ui/core/experimental';

export default function TestPage() {
	// Global states
	const [, setTheme] = useUI<'light' | 'dark'>('test-theme', 'light');
	const [, setColor] = useUI<'red' | 'blue' | 'green'>('test-color', 'red');
	const [, setSize] = useUI<'sm' | 'md' | 'lg'>('test-size', 'md');
	const [, setToggle] = useUI<'on' | 'off'>('test-toggle', 'off');

	// Scoped states
	const [accordion, setAccordion] = useScopedUI<'open' | 'closed'>('test-accordion', 'closed');
	const [tab, setTab] = useScopedUI<'tab1' | 'tab2' | 'tab3'>('test-tab', 'tab1');

	// CSS variable state
	const [, setOpacity] = useUI<'0' | '0.5' | '1'>('test-opacity', '1', cssVar);
	const [, setSpacing] = useUI<'4px' | '8px' | '16px'>('test-spacing', '8px', cssVar);

	return (
		<div
			data-testid="test-page-root"
			className="p-8 space-y-8">
			{/* Global State Tests */}
			<section
				data-testid="global-state-section"
				className="border p-4 space-y-4">
				<h2 className="text-xl font-bold">Global State Tests</h2>

				{/* Theme Test */}
				<div
					data-testid="theme-test"
					className="test-theme-light:bg-white test-theme-dark:bg-black test-theme-light:text-black test-theme-dark:text-white p-4">
					<button
						data-testid="theme-button"
						onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
						className="border px-4 py-2">
						Toggle Theme
					</button>
					<span
						data-testid="theme-value"
						className="ml-4">
						<span className="test-theme-light:inline test-theme-dark:hidden">light</span>
						<span className="test-theme-dark:inline test-theme-light:hidden">dark</span>
					</span>
				</div>

				{/* Color Test */}
				<div
					data-testid="color-test"
					className="test-color-red:bg-red-500 test-color-blue:bg-blue-500 test-color-green:bg-green-500 p-4">
					<button
						data-testid="color-red"
						onClick={() => setColor('red')}
						className="border px-4 py-2 mr-2">
						Red
					</button>
					<button
						data-testid="color-blue"
						onClick={() => setColor('blue')}
						className="border px-4 py-2 mr-2">
						Blue
					</button>
					<button
						data-testid="color-green"
						onClick={() => setColor('green')}
						className="border px-4 py-2">
						Green
					</button>
					<span
						data-testid="color-value"
						className="ml-4">
						<span className="test-color-red:inline hidden">red</span>
						<span className="test-color-blue:inline hidden">blue</span>
						<span className="test-color-green:inline hidden">green</span>
					</span>
				</div>

				{/* Toggle Test */}
				<div
					data-testid="toggle-test"
					className="test-toggle-on:bg-green-200 test-toggle-off:bg-gray-200 p-4">
					<button
						data-testid="toggle-button"
						onClick={() => setToggle((prev) => (prev === 'on' ? 'off' : 'on'))}
						className="border px-4 py-2">
						Toggle
					</button>
					<span
						data-testid="toggle-value"
						className="ml-4">
						<span className="test-toggle-on:inline test-toggle-off:hidden">on</span>
						<span className="test-toggle-off:inline test-toggle-on:hidden">off</span>
					</span>
				</div>
			</section>

			{/* Scoped State Tests */}
			<section
				data-testid="scoped-state-section"
				className="border p-4 space-y-4">
				<h2 className="text-xl font-bold">Scoped State Tests</h2>

				{/* Accordion Test */}
				<div
					data-testid="accordion-test"
					ref={setAccordion.ref}
					data-test-accordion={accordion}
					className="border">
					<button
						data-testid="accordion-toggle"
						onClick={() => setAccordion((prev) => (prev === 'open' ? 'closed' : 'open'))}
						className="w-full p-4 text-left border-b">
						Accordion Header
					</button>
					<div
						data-testid="accordion-content"
						className="test-accordion-open:block test-accordion-closed:hidden p-4">
						Accordion Content
					</div>
					<span
						data-testid="accordion-value"
						className="hidden">
						<span className="test-accordion-open:inline test-accordion-closed:hidden">open</span>
						<span className="test-accordion-closed:inline test-accordion-open:hidden">closed</span>
					</span>
				</div>

				{/* Tab Test */}
				<div
					data-testid="tab-test"
					ref={setTab.ref}
					data-test-tab={tab}>
					<div className="flex border-b">
						<button
							data-testid="tab-1"
							onClick={() => setTab('tab1')}
							className="px-4 py-2 test-tab-tab1:bg-blue-500 test-tab-tab1:text-white">
							Tab 1
						</button>
						<button
							data-testid="tab-2"
							onClick={() => setTab('tab2')}
							className="px-4 py-2 test-tab-tab2:bg-blue-500 test-tab-tab2:text-white">
							Tab 2
						</button>
						<button
							data-testid="tab-3"
							onClick={() => setTab('tab3')}
							className="px-4 py-2 test-tab-tab3:bg-blue-500 test-tab-tab3:text-white">
							Tab 3
						</button>
					</div>
					<div className="p-4">
						<div
							data-testid="tab-content-1"
							className="test-tab-tab1:block hidden">
							Tab 1 Content
						</div>
						<div
							data-testid="tab-content-2"
							className="test-tab-tab2:block hidden">
							Tab 2 Content
						</div>
						<div
							data-testid="tab-content-3"
							className="test-tab-tab3:block hidden">
							Tab 3 Content
						</div>
					</div>
					<span
						data-testid="tab-value"
						className="hidden">
						<span className="test-tab-tab1:inline hidden">tab1</span>
						<span className="test-tab-tab2:inline hidden">tab2</span>
						<span className="test-tab-tab3:inline hidden">tab3</span>
					</span>
				</div>
			</section>

			{/* SSR Tests */}
			<section
				data-testid="ssr-section"
				className="border p-4 space-y-4">
				<h2 className="text-xl font-bold">SSR Tests</h2>

				{/* Global SSR */}
				<div
					data-testid="ssr-global-test"
					data-test-ssr-theme="light"
					className="test-ssr-theme-light:bg-gray-100 test-ssr-theme-dark:bg-gray-900 p-4">
					<button
						data-testid="ssr-global-button"
						{...zeroSSR.onClick('test-ssr-theme', ['light', 'dark'])}
						className="border px-4 py-2">
						SSR Toggle (Global)
					</button>
					<span
						data-testid="ssr-global-light"
						className="test-ssr-theme-light:inline hidden ml-4">
						Light
					</span>
					<span
						data-testid="ssr-global-dark"
						className="test-ssr-theme-dark:inline hidden ml-4">
						Dark
					</span>
				</div>

				{/* Scoped SSR */}
				<div
					data-testid="ssr-scoped-test"
					data-test-ssr-menu="closed"
					className="test-ssr-menu-open:border-green-500 test-ssr-menu-closed:border-red-500 border-2 p-4">
					<button
						data-testid="ssr-scoped-button"
						{...scopedZeroSSR.onClick('test-ssr-menu', ['open', 'closed'])}
						className="border px-4 py-2">
						SSR Toggle (Scoped)
					</button>
					<div
						data-testid="ssr-menu-content"
						className="test-ssr-menu-open:block test-ssr-menu-closed:hidden mt-2">
						Menu is open
					</div>
				</div>
			</section>

			{/* CSS Variable Tests */}
			<section
				data-testid="css-var-section"
				className="border p-4 space-y-4">
				<h2 className="text-xl font-bold">CSS Variable Tests</h2>

				{/* Opacity Test */}
				<div
					data-testid="opacity-test"
					className="p-4">
					<div
						data-testid="opacity-target"
						className="bg-blue-500 p-4 mb-4"
						style={{ opacity: 'var(--test-opacity)' }}>
						Opacity Target
					</div>
					<button
						data-testid="opacity-0"
						onClick={() => setOpacity('0')}
						className="border px-4 py-2 mr-2">
						0%
					</button>
					<button
						data-testid="opacity-50"
						onClick={() => setOpacity('0.5')}
						className="border px-4 py-2 mr-2">
						50%
					</button>
					<button
						data-testid="opacity-100"
						onClick={() => setOpacity('1')}
						className="border px-4 py-2">
						100%
					</button>
					<span
						data-testid="opacity-value"
						className="ml-4">
						<span className="test-opacity-0:inline hidden">0</span>
						<span className="test-opacity-05:inline hidden">0.5</span>
						<span className="test-opacity-1:inline hidden">1</span>
					</span>
				</div>

				{/* Spacing Test */}
				<div
					data-testid="spacing-test"
					className="p-4">
					<div
						data-testid="spacing-target"
						className="bg-green-500"
						style={{ padding: 'var(--test-spacing)' }}>
						Spacing Target
					</div>
					<div className="mt-4">
						<button
							data-testid="spacing-4"
							onClick={() => setSpacing('4px')}
							className="border px-4 py-2 mr-2">
							4px
						</button>
						<button
							data-testid="spacing-8"
							onClick={() => setSpacing('8px')}
							className="border px-4 py-2 mr-2">
							8px
						</button>
						<button
							data-testid="spacing-16"
							onClick={() => setSpacing('16px')}
							className="border px-4 py-2">
							16px
						</button>
						<span
							data-testid="spacing-value"
							className="ml-4">
							<span className="test-spacing-4px:inline hidden">4px</span>
							<span className="test-spacing-8px:inline hidden">8px</span>
							<span className="test-spacing-16px:inline hidden">16px</span>
						</span>
					</div>
				</div>
			</section>

			{/* State Update Patterns */}
			<section
				data-testid="patterns-section"
				className="border p-4 space-y-4">
				<h2 className="text-xl font-bold">State Update Patterns</h2>

				{/* Direct Set */}
				<div data-testid="direct-set-test">
					<button
						data-testid="size-direct-sm"
						onClick={() => setSize('sm')}
						className="border px-4 py-2 mr-2 test-size-sm:bg-yellow-500">
						Small
					</button>
					<button
						data-testid="size-direct-md"
						onClick={() => setSize('md')}
						className="border px-4 py-2 mr-2 test-size-md:bg-yellow-500">
						Medium
					</button>
					<button
						data-testid="size-direct-lg"
						onClick={() => setSize('lg')}
						className="border px-4 py-2 test-size-lg:bg-yellow-500">
						Large
					</button>
					<span
						data-testid="size-value"
						className="ml-4">
						<span className="test-size-sm:inline hidden">sm</span>
						<span className="test-size-md:inline hidden">md</span>
						<span className="test-size-lg:inline hidden">lg</span>
					</span>
				</div>

				{/* Function Update */}
				<div
					data-testid="function-update-test"
					className="mt-4">
					<button
						data-testid="theme-function"
						onClick={() =>
							setTheme((current) => {
								console.log('Current theme:', current);
								return current === 'light' ? 'dark' : 'light';
							})
						}
						className="border px-4 py-2">
						Toggle Theme (Function)
					</button>
				</div>
			</section>
		</div>
	);
}
