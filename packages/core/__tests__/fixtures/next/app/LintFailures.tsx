'use client';
import { useScopedUI } from '@react-zero-ui/core';

/**
 * This component is intentionally WRONG.
 * – Missing data-attr on <section>
 * – Missing ref attachment on <aside>
 *
 * The Zero-UI ESLint rule should flag both.
 */
export default function LintFailures() {
	// #1  Setter attached but no data-scope attr  →  missingAttr error
	const [scope, setScope] = useScopedUI<'off' | 'on'>('scope', 'off');

	// #2  No ref at all  →  missingRef error
	const [, setDialog] = useScopedUI<'open' | 'closed'>('dialog', 'closed');

	return (
		<main className="space-y-6 p-6">
			{/* ❌ lint error expected here */}
			<section
				ref={setScope.ref}
				className="scope-off:bg-red-100 scope-on:bg-red-600 scope-on:text-white p-4 rounded">
				<button
					className="border px-3 py-1"
					onClick={() => setScope((prev) => (prev === 'on' ? 'off' : 'on'))}>
					Toggle scope
				</button>
			</section>

			{/* ❌ second lint error (missing .ref) */}
			<aside className="dialog-open:block dialog-closed:hidden">
				This dialog was never linked via <code>ref</code>
			</aside>
		</main>
	);
}

/* ------------------------------------------------------------------ *
 |  Correct version (for reference)                                   |
 * ------------------------------------------------------------------ *
  const [scope, setScope] = useScopedUI<'off' | 'on'>('scope', 'off');
  <section
    data-scope={scope}
    ref={setScope.ref}
  >
    …
  </section>

  const [, setDialog] = useScopedUI<'open'|'closed'>('dialog','closed');
  <aside ref={setDialog.ref} data-dialog="closed">…</aside>
*/
