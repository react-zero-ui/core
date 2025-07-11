import { parse, parseExpression, ParserOptions } from '@babel/parser';
import * as babelTraverse from '@babel/traverse';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { generate } from '@babel/generator';
const traverse = (babelTraverse as any).default;
import * as fs from 'fs';
import fg from 'fast-glob';
import { IGNORE_DIRS } from '../config.cjs';

const AST_CONFIG_OPTS: Partial<ParserOptions> = {
	sourceType: 'unambiguous',
	plugins: [
		'typescript', // in case it's postcss.config.ts / .cts / .mts
		'jsx', // harmless, needed for rare edge cases
		'classProperties', // safe if someone uses class-based config
		'decorators-legacy', // legacy decorators (safe fallback)
		'dynamicImport', // some setups use dynamic import()
		'importMeta', // future-proofing
		'jsonStrings', // for JSON config files
		'topLevelAwait', // for async config
	],
};

/**
 * Parse PostCSS config JavaScript file and add Zero-UI plugin if not present
 * Uses Babel AST for robust parsing and modification
 * Supports both CommonJS (.js) and ES Modules (.mjs) formats
 * @param {string} source - The PostCSS config source code
 * @param {string} zeroUiPlugin - The Zero-UI plugin name
 * @param {boolean} isESModule - Whether the config is an ES module
 * @returns {string | null} The modified config code or null if no changes were made
 */
export function parseAndUpdatePostcssConfig(source: string, zeroUiPlugin: string, isESModule: boolean = false): string | null {
	try {
		const ast = parse(source, AST_CONFIG_OPTS);

		let modified = false;

		traverse(ast, {
			// Handle CommonJS: module.exports = { ... } and exports = { ... }
			AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
				const { left, right } = path.node;

				// Check for module.exports or exports assignment
				const isModuleExports =
					t.isMemberExpression(left) && t.isIdentifier(left.object, { name: 'module' }) && t.isIdentifier(left.property, { name: 'exports' });
				const isExportsAssignment = t.isIdentifier(left, { name: 'exports' });

				if ((isModuleExports || isExportsAssignment) && t.isObjectExpression(right)) {
					const pluginsProperty = right.properties.find(
						(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
					);

					if (pluginsProperty && t.isExpression(pluginsProperty.value)) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},

			// Handle ES Modules: export default { ... }
			ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
				if (isESModule && t.isObjectExpression(path.node.declaration)) {
					const pluginsProperty = path.node.declaration.properties.find(
						(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
					);

					if (pluginsProperty && t.isExpression(pluginsProperty.value)) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},

			// Handle: const config = { plugins: ... }; export default config
			VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
				if (isESModule && path.node.init && t.isObjectExpression(path.node.init)) {
					const pluginsProperty = path.node.init.properties.find(
						(prop): prop is t.ObjectProperty => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'plugins' })
					);

					if (pluginsProperty && t.isExpression(pluginsProperty.value)) {
						modified = addZeroUiToPlugins(pluginsProperty.value, zeroUiPlugin);
					}
				}
			},
		});

		if (modified) {
			return generate(ast).code;
		} else {
			console.warn(`[Zero-UI] Failed to automatically modify PostCSS config: ${source}`);
			return null; // Could not automatically modify
		}
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.warn(`[Zero-UI] Failed to parse PostCSS config: ${errorMessage} ${source}`);
		return null;
	}
}

/**
 * Helper function to add Zero-UI plugin to plugins configuration
 * Handles both object format {plugin: {}} and array format [plugin]
 */
function addZeroUiToPlugins(pluginsNode: t.Expression, zeroUiPlugin: string): boolean {
	if (t.isObjectExpression(pluginsNode)) {
		// Object format: { 'plugin': {} }
		pluginsNode.properties.unshift(t.objectProperty(t.stringLiteral(zeroUiPlugin), t.objectExpression([])));
		return true;
	} else if (t.isArrayExpression(pluginsNode)) {
		// Array format: ['plugin']
		pluginsNode.elements.unshift(t.stringLiteral(zeroUiPlugin));
		return true;
	}
	return false;
}

/**
 * Parse Vite config TypeScript/JavaScript file and add Zero-UI plugin
 * Removes tailwindcss plugin if present, and adds zeroUI plugin if missing
 * @param {string} source - The Vite config source code
 * @param {string} zeroUiImportPath - The Zero-UI plugin import path
 * @returns {string | null} The modified config code or null if no changes were made
 */
export function parseAndUpdateViteConfig(source: string, zeroUiImportPath: string): string | null {
	let ast: t.File;
	try {
		ast = parse(source, AST_CONFIG_OPTS);
	} catch (e) {
		throw new Error(`[Zero-UI] Failed to parse vite.config: ${e instanceof Error ? e.message : String(e)}`);
	}

	let modified = false;

	traverse(ast, {
		Program(p: NodePath<t.Program>) {
			// inject import once
			if (!source.includes(zeroUiImportPath)) {
				p.node.body.unshift(t.importDeclaration([t.importDefaultSpecifier(t.identifier('zeroUI'))], t.stringLiteral(zeroUiImportPath)));
				modified = true;
			}
		},

		CallExpression(p: NodePath<t.CallExpression>) {
			if (t.isIdentifier(p.node.callee, { name: 'defineConfig' }) && t.isObjectExpression(p.node.arguments[0])) {
				if (processConfigObject(p.node.arguments[0])) modified = true;
			}
		},

		ExportDefaultDeclaration(p: NodePath<t.ExportDefaultDeclaration>) {
			const decl = p.node.declaration;
			let obj: t.ObjectExpression | null = null;

			if (t.isObjectExpression(decl)) obj = decl;
			else if (t.isIdentifier(decl)) {
				const b = p.scope.getBinding(decl.name);
				if (b?.path.isVariableDeclarator() && t.isObjectExpression(b.path.node.init)) obj = b.path.node.init;
			} else if ((t.isFunctionDeclaration(decl) || t.isArrowFunctionExpression(decl) || t.isFunctionExpression(decl)) && t.isObjectExpression(decl.body)) {
				obj = decl.body;
			}

			if (obj && processConfigObject(obj)) modified = true;
		},

		ReturnStatement(p: NodePath<t.ReturnStatement>) {
			const arg = p.node.argument;
			if (t.isObjectExpression(arg) && processConfigObject(arg)) modified = true;
		},

		ObjectExpression(p: NodePath<t.ObjectExpression>) {
			if (processConfigObject(p.node)) modified = true;
		},

		ImportDeclaration(p: NodePath<t.ImportDeclaration>) {
			if (p.node.source.value.startsWith('@tailwindcss/')) {
				p.remove();
				modified = true;
			}
		},
	});

	return modified ? generate(ast).code : null;
}

/* ------------------------------------------------------------------ *
 *  processConfigObject - mutate a { plugins: [...] }
 * ------------------------------------------------------------------ */
function processConfigObject(obj: t.ObjectExpression): boolean {
	let touched = false;

	// locate/create plugins array
	let prop = obj.properties.find((p): p is t.ObjectProperty => t.isObjectProperty(p) && t.isIdentifier(p.key, { name: 'plugins' }));

	if (!prop) {
		prop = t.objectProperty(t.identifier('plugins'), t.arrayExpression([]));
		obj.properties.push(prop);
		touched = true;
	}
	if (!t.isArrayExpression(prop.value)) return touched;
	const arr = prop.value;

	// strip Tailwind
	arr.elements = arr.elements.filter(
		(el) =>
			!(
				(t.isStringLiteral(el) && el.value.startsWith('@tailwindcss/')) || // ← ❸ filter all Tailwind strings
				(t.isCallExpression(el) && t.isIdentifier(el.callee, { name: 'tailwindcss' }))
			)
	);
	// prepend zeroUI() if missing
	if (!arr.elements.some((el) => t.isCallExpression(el) && t.isIdentifier(el.callee, { name: 'zeroUI' }))) {
		arr.elements.unshift(t.callExpression(t.identifier('zeroUI'), []));
		touched = true;
	}

	return touched;
}

function findLayoutWithBody(root = process.cwd()): string[] {
	const files = fg.sync('**/layout.{tsx,jsx,js,ts}', { cwd: root, ignore: IGNORE_DIRS, absolute: true });

	return files.filter((file) => {
		const source = fs.readFileSync(file, 'utf8');
		return source.includes('<body');
	});
}

export async function patchNextBodyTag(): Promise<void> {
	const matches = findLayoutWithBody();

	if (matches.length !== 1) {
		console.warn(`[Zero-UI] ⚠️ Found ${matches.length} layout files with <body> tags. ` + `Expected exactly one. Skipping automatic injection.`);
		return;
	}

	const filePath = matches[0];
	const code = fs.readFileSync(filePath, 'utf8');

	// Parse the file into an AST
	const ast = parse(code, AST_CONFIG_OPTS);

	let hasImport = false;
	traverse(ast, {
		ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
			const specifiers = path.node.specifiers;
			const source = path.node.source.value;
			if (source === '@zero-ui/attributes') {
				for (const spec of specifiers) {
					if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === 'bodyAttributes') {
						hasImport = true;
					}
				}
			}
		},
	});

	traverse(ast, {
		Program(path: NodePath<t.Program>) {
			if (!hasImport) {
				const importDecl = t.importDeclaration(
					[t.importSpecifier(t.identifier('bodyAttributes'), t.identifier('bodyAttributes'))],
					t.stringLiteral('@zero-ui/attributes')
				);
				path.node.body.unshift(importDecl);
			}
		},
	});

	// Inject JSX spread into <body>
	let injected = false;
	traverse(ast, {
		JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
			if (!injected && t.isJSXIdentifier(path.node.name, { name: 'body' })) {
				// Prevent duplicate injection
				const hasSpread = path.node.attributes.some((attr) => t.isJSXSpreadAttribute(attr) && t.isIdentifier(attr.argument, { name: 'bodyAttributes' }));
				if (!hasSpread) {
					path.node.attributes.unshift(t.jsxSpreadAttribute(t.identifier('bodyAttributes')));
					injected = true;
				}
			}
		},
	});

	const output = generate(ast, { retainLines: true, decoratorsBeforeExport: true }, code).code;
	fs.writeFileSync(filePath, output, 'utf8');
	console.log(`[Zero-UI] ✅ Patched <body> in ${filePath} with {...bodyAttributes}`);
}

/**
 * Parse a tsconfig/jsconfig JSON file using Babel (handles comments, trailing commas)
 */
export function parseJsonWithBabel(source: string): any {
	try {
		const ast = parseExpression(source, { sourceType: 'module', plugins: ['jsonStrings'] });
		// Convert Babel AST back to plain JS object
		return eval(`(${generate(ast).code})`);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.warn(`[Zero-UI] Failed to parse ${source}: ${errorMessage}`);
		return null;
	}
}
