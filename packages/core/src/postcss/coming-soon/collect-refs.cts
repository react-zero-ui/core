import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import * as babelTraverse from '@babel/traverse';
import type { SetterMeta } from '../v2/ast-v2.cjs';
const traverse = (babelTraverse as any).default;

export interface RefLocation {
	filePath: string; //'./src/components/ThemeToggle.tsx',
	elementName: string; // 'button',
	line: number; // 15
	column: number; // 8
	stateKey: string; // 'theme',
	refProperty: string; // 'ref',
}

/**
 * Find all JSX attributes that reference setter.ref patterns
 * @param ast - Parsed AST
 * @param filePath - Current file path for location tracking
 * @param setters - SetterMeta array from Pass 1
 * @returns RefLocation[]
 */
export function collectRefLocations(ast: t.File, filePath: string, setters: SetterMeta[]): RefLocation[] {
	const refLocations: RefLocation[] = [];

	// Create a map of setter variable names to their state keys
	const setterNameToStateKey = new Map<string, string>();
	for (const setter of setters) {
		setterNameToStateKey.set(setter.setterName, setter.stateKey);
	}

	traverse(ast, {
		JSXAttribute(path: NodePath<t.JSXAttribute>) {
			const { name, value } = path.node;

			// Must be a regular attribute (not spread)
			if (!t.isJSXIdentifier(name)) return;

			// Must be exactly "ref" attribute
			if (name.name !== 'ref') return;

			// Must be an expression container
			if (!t.isJSXExpressionContainer(value)) return;

			// Must be exactly: setterFn.ref (no other variations allowed)
			const expression = value.expression;
			if (t.isMemberExpression(expression) && t.isIdentifier(expression.object) && t.isIdentifier(expression.property, { name: 'ref' })) {
				const setterName = expression.object.name;
				const stateKey = setterNameToStateKey.get(setterName);

				if (stateKey) {
					// Find the JSX element name
					const elementName = getJSXElementName(path);
					const loc = path.node.loc;

					refLocations.push({
						filePath,
						elementName,
						line: loc?.start.line || 0,
						column: loc?.start.column || 0,
						stateKey,
						refProperty: 'ref', // Always 'ref' now
					});
				}
			}
		},
	});

	return refLocations;
}

/**
 * Get the JSX element name from a JSX attribute path
 */
function getJSXElementName(attributePath: NodePath<t.JSXAttribute>): string {
	const jsxElement = attributePath.findParent((path) => path.isJSXElement());

	if (jsxElement && jsxElement.isJSXElement()) {
		const openingElement = jsxElement.node.openingElement;
		const name = openingElement.name;

		if (t.isJSXIdentifier(name)) {
			return name.name;
		} else if (t.isJSXMemberExpression(name)) {
			// Handle cases like <Component.SubComponent>
			return getJSXMemberExpressionName(name);
		} else if (t.isJSXNamespacedName(name)) {
			// Handle cases like <namespace:Component>
			return `${name.namespace.name}:${name.name.name}`;
		}
	}

	return 'unknown';
}

/**
 * Convert JSX member expression to string (e.g., Component.SubComponent)
 */
function getJSXMemberExpressionName(expr: t.JSXMemberExpression): string {
	const parts: string[] = [];

	let current: t.JSXMemberExpression | t.JSXIdentifier = expr;
	while (t.isJSXMemberExpression(current)) {
		if (t.isJSXIdentifier(current.property)) {
			parts.unshift(current.property.name);
		}
		current = current.object;
	}

	if (t.isJSXIdentifier(current)) {
		parts.unshift(current.name);
	}

	return parts.join('.');
}

/**
 * Global ref location tracker for the entire app
 */
export class RefLocationTracker {
	private refMap = new Map<string, RefLocation[]>();

	/**
	 * Add ref locations from a file
	 */
	addFile(filePath: string, refLocations: RefLocation[]): void {
		this.refMap.set(filePath, refLocations);
	}

	/**
	 * Get all ref locations for a specific state key
	 */
	getRefsByStateKey(stateKey: string): RefLocation[] {
		const results: RefLocation[] = [];

		for (const locations of this.refMap.values()) {
			results.push(...locations.filter((loc) => loc.stateKey === stateKey));
		}

		return results;
	}

	/**
	 * Get all ref locations in a specific file
	 */
	getRefsByFile(filePath: string): RefLocation[] {
		return this.refMap.get(filePath) || [];
	}

	/**
	 * Get all ref locations for a specific element type
	 */
	getRefsByElement(elementName: string): RefLocation[] {
		const results: RefLocation[] = [];

		for (const locations of this.refMap.values()) {
			results.push(...locations.filter((loc) => loc.elementName === elementName));
		}

		return results;
	}

	/**
	 * Get all ref locations in the entire app
	 */
	getAllRefs(): RefLocation[] {
		const results: RefLocation[] = [];

		for (const locations of this.refMap.values()) {
			results.push(...locations);
		}

		return results;
	}

	/**
	 * Clear all stored locations
	 */
	clear(): void {
		this.refMap.clear();
	}

	/**
	 * Remove a specific file from tracking
	 */
	removeFile(filePath: string): void {
		this.refMap.delete(filePath);
	}
}
