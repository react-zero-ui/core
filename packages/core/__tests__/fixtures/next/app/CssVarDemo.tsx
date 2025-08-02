'use client';

import { useScopedUI, cssVar } from '@react-zero-ui/core';

/**
 * CssVarDemo - minimal fixture for Playwright
 *
 * • Flips a scoped CSS variable `--blur` between "0px" ⇄ "4px"
 * • Uses the updater-function pattern (`prev ⇒ next`)
 * • Exposes test-ids so your spec can assert both style + text
 */
export default function CssVarDemo({ index = 0 }) {
	// 👇 pass `cssVar` flag to switch makeSetter into CSS-var mode
	const [blur, setBlur] = useScopedUI<'0px' | '4px'>('blur', '0px', cssVar);
	// global test
	//@ts-ignore

	return (
		<div
			ref={setBlur.ref} // element that owns --blur
			data-testid={`demo-${index}`}
			style={{ filter: 'blur(var(--blur, 0px))' }} // read the var
			className="m-4 p-6 rounded bg-slate-200 space-y-3">
			<button
				data-testid={`toggle-${index}`}
				onClick={() => setBlur((prev) => (prev === '0px' ? '4px' : '0px'))}
				className="px-3 py-1 rounded bg-black text-white ">
				toggle blur
			</button>

			{/* expose current value for assertions */}
			<p data-testid={`value-${index}`}>{blur}</p>
		</div>
	);
}
