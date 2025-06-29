import { parse } from '@babel/parser';
import traverse, { Binding } from '@babel/traverse';
import * as t from '@babel/types';
import { CONFIG } from '../config.cjs';

export interface SetterMeta {
	/** Babel binding object — use `binding.referencePaths` in Pass 2 */
	binding: Binding;
	/** Variable name (`setTheme`) */
	setterName: string;
	/** State key passed to `useUI` (`'theme'`) */
	stateKey: string;
	/** Literal initial value as string, or `null` if non-literal */
	initialValue: string | null;
}

/**
 * Collects every `[ , setter ] = useUI('key', 'initial')` in a file.
 */
export function collectUseUISetters(ast: t.File): SetterMeta[] {
	const setters: SetterMeta[] = [];

	traverse(ast, {
		VariableDeclarator(path: any) {
			const { id, init } = path.node;

			// Match: const [ , setX ] = useUI(...)
			if (t.isArrayPattern(id) && id.elements.length === 2 && t.isCallExpression(init) && t.isIdentifier(init.callee, { name: CONFIG.HOOK_NAME })) {
				const [, setterEl] = id.elements;
				if (!t.isIdentifier(setterEl)) return; // hole or non-identifier

				// Validate & grab hook args
				const [keyArg, initialArg] = init.arguments;
				if (!t.isStringLiteral(keyArg)) return; // dynamic keys are ignored

				setters.push({
					binding: path.scope.getBinding(setterEl.name)!, // never null here
					setterName: setterEl.name,
					stateKey: keyArg.value,
					initialValue: literalToString(initialArg as t.Expression),
				});
			}
		},
	});

	return setters;
}

/* ————— helpers ————— */
function literalToString(node: t.Expression | undefined): string | null {
	if (!node) return null;
	if (t.isStringLiteral(node) || t.isNumericLiteral(node)) return String(node.value);
	if (t.isBooleanLiteral(node)) return node.value ? 'true' : 'false';
	return null; // non-literal ⇒ treat as dynamic
}
