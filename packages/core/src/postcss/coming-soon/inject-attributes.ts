import { parse } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { generate } from '@babel/generator';
import type { RefLocation, RefLocationTracker } from './collect-refs.cjs';
import type { VariantData } from '../ast-v2.cjs';

const traverse = (babelTraverse as any).default;

export interface DataAttributeConfig {
	/** Attribute name pattern. Use {stateKey} for substitution */
	attributeName: string;
	/** Attribute value pattern. Use {stateKey}, {elementName}, {initialValue} for substitution */
	attributeValue?: string;
	/** Whether to include the initial value in the attribute */
	includeInitialValue?: boolean;
}

/**
 * Default configuration for data attributes
 */
export const DEFAULT_DATA_ATTRIBUTE_CONFIG: DataAttributeConfig = {
	attributeName: 'data-ui-{stateKey}',
	attributeValue: '{initialValue}', // e.g., data-ui-theme="light"
	includeInitialValue: true,
};

/**
 * Inject data attributes into JSX elements based on ref locations
 * @param sourceCode - Original source code
 * @param refLocations - Array of ref locations from the ref tracker
 * @param variantData - Variant data to get initial values
 * @param config - Configuration for attribute generation
 * @returns Modified source code with injected data attributes
 */
export function injectDataAttributes(
	sourceCode: string,
	refLocations: RefLocation[],
	variantData: VariantData[],
	config: DataAttributeConfig = DEFAULT_DATA_ATTRIBUTE_CONFIG
): string {
	// Create a map of stateKey -> initial value for quick lookup
	const initialValueMap = new Map<string, string>();
	for (const variant of variantData) {
		if (variant.initialValue) {
			initialValueMap.set(variant.key, variant.initialValue);
		}
	}

	// Parse the source code
	const ast = parse(sourceCode, {
		sourceType: 'module',
		plugins: ['jsx', 'typescript', 'decorators-legacy'],
		allowImportExportEverywhere: true,
		allowReturnOutsideFunction: true,
	});

	// Create a map of line:column -> RefLocation for quick lookup
	const locationMap = new Map<string, RefLocation>();
	for (const refLoc of refLocations) {
		const key = `${refLoc.line}:${refLoc.column}`;
		locationMap.set(key, refLoc);
	}

	// Traverse and inject data attributes
	traverse(ast, {
		JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
			const loc = path.node.loc;
			if (!loc) return;

			const key = `${loc.start.line}:${loc.start.column}`;
			const refLocation = locationMap.get(key);

			if (refLocation) {
				// Check if the element already has a ref={setterFn.ref} attribute
				const hasTargetRef = path.node.attributes.some((attr) => {
					if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'ref' }) && t.isJSXExpressionContainer(attr.value)) {
						const expr = attr.value.expression;
						return t.isMemberExpression(expr) && t.isIdentifier(expr.property, { name: 'ref' });
					}
					return false;
				});

				if (hasTargetRef) {
					// Generate the data attribute
					const dataAttr = createDataAttribute(refLocation, initialValueMap, config);
					if (dataAttr) {
						// Check if this data attribute already exists
						const existingAttr = path.node.attributes.find(
							(attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === dataAttr.name.name
						);

						if (!existingAttr) {
							path.node.attributes.push(dataAttr);
						}
					}
				}
			}
		},
	});

	// Generate the modified code
	const result = generate(ast, { retainLines: true, compact: false });

	return result.code;
}

/**
 * Create a JSX data attribute based on ref location and config
 */
function createDataAttribute(refLocation: RefLocation, initialValueMap: Map<string, string>, config: DataAttributeConfig): t.JSXAttribute | null {
	const { stateKey, elementName } = refLocation;
	const initialValue = initialValueMap.get(stateKey) || '';

	// Generate attribute name
	const attributeName = config.attributeName.replace('{stateKey}', stateKey).replace('{elementName}', elementName);

	// Generate attribute value
	let attributeValue = '';
	if (config.attributeValue) {
		attributeValue = config.attributeValue.replace('{stateKey}', stateKey).replace('{elementName}', elementName).replace('{initialValue}', initialValue);
	} else if (config.includeInitialValue) {
		attributeValue = initialValue;
	}

	// Create the JSX attribute
	const name = t.jsxIdentifier(attributeName);
	const value = attributeValue ? t.stringLiteral(attributeValue) : null;

	return t.jsxAttribute(name, value);
}

/**
 * Batch process multiple files
 * @param fileContents - Map of filePath -> source code
 * @param refTracker - Global ref tracker with all locations
 * @param variantData - All variant data
 * @param config - Data attribute configuration
 * @returns Map of filePath -> modified source code
 */
export function batchInjectDataAttributes(
	fileContents: Map<string, string>,
	refTracker: RefLocationTracker,
	variantData: VariantData[],
	config: DataAttributeConfig = DEFAULT_DATA_ATTRIBUTE_CONFIG
): Map<string, string> {
	const results = new Map<string, string>();

	for (const [filePath, sourceCode] of fileContents) {
		const refLocations = refTracker.getRefsByFile(filePath);

		if (refLocations.length > 0) {
			const modifiedCode = injectDataAttributes(sourceCode, refLocations, variantData, config);
			results.set(filePath, modifiedCode);
		} else {
			// No refs in this file, return unchanged
			results.set(filePath, sourceCode);
		}
	}

	return results;
}

/**
 * Webpack/Vite plugin helper
 * Transform source code during build
 */
export function createDataAttributeTransformer(
	refTracker: RefLocationTracker,
	variantData: VariantData[],
	config: DataAttributeConfig = DEFAULT_DATA_ATTRIBUTE_CONFIG
) {
	return function transformCode(sourceCode: string, filePath: string): string {
		const refLocations = refTracker.getRefsByFile(filePath);

		if (refLocations.length === 0) {
			return sourceCode; // No changes needed
		}

		return injectDataAttributes(sourceCode, refLocations, variantData, config);
	};
}

// Example usage configurations:

/**
 * Configuration for semantic data attributes
 */
export const SEMANTIC_CONFIG: DataAttributeConfig = { attributeName: 'data-ui-{stateKey}', attributeValue: '{initialValue}', includeInitialValue: true };
// Result: <button ref={setTheme.ref} data-ui-theme="light">

/**
 * Configuration for CSS selector-friendly attributes
 */
export const CSS_SELECTOR_CONFIG: DataAttributeConfig = { attributeName: 'data-state-{stateKey}', attributeValue: undefined, includeInitialValue: false };
// Result: <button ref={setTheme.ref} data-state-theme>

/**
 * Configuration for debugging/development
 */
export const DEBUG_CONFIG: DataAttributeConfig = {
	attributeName: 'data-debug-ui',
	attributeValue: '{stateKey}:{elementName}:{initialValue}',
	includeInitialValue: true,
};
// Result: <button ref={setTheme.ref} data-debug-ui="theme:button:light">
