import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { extractVariantsFromFiles } from '../v2/ast-v2.cjs';
import { batchInjectDataAttributes, SEMANTIC_CONFIG } from './inject-attributes.js';
import { RefLocationTracker } from './collect-refs.cjs';

const globalRefTracker = new RefLocationTracker();

/**
 * Complete build process example
 */
export async function buildWithDataAttributes() {
	console.log('🔍 Scanning for useUI usage...');

	// 1. Find all relevant files
	const files = await glob('src/**/*.{ts,tsx,js,jsx}', { ignore: ['**/*.d.ts', '**/node_modules/**'] });

	// 2. Extract variants and populate ref tracker
	console.log(`📋 Processing ${files.length} files...`);
	const allVariants = extractVariantsFromFiles(files);

	console.log(
		'✅ Found variants:',
		allVariants.map((v) => `${v.key}: [${v.values.join(', ')}]`)
	);

	// 3. Read all file contents
	const fileContents = new Map<string, string>();
	for (const filePath of files) {
		const content = readFileSync(filePath, 'utf-8');
		fileContents.set(filePath, content);
	}

	// 4. Inject data attributes
	console.log('💉 Injecting data attributes...');
	const modifiedFiles = batchInjectDataAttributes(fileContents, globalRefTracker, allVariants, SEMANTIC_CONFIG);

	// 5. Write modified files (or handle according to your build system)
	let modifiedCount = 0;
	for (const [filePath, originalContent] of fileContents) {
		const modifiedContent = modifiedFiles.get(filePath)!;

		if (modifiedContent !== originalContent) {
			// In a real build system, you might return the modified content
			// instead of writing directly to disk
			writeFileSync(filePath, modifiedContent);
			modifiedCount++;
		}
	}

	console.log(`✨ Modified ${modifiedCount} files with data attributes`);

	// 6. Generate CSS or other assets based on variants
	generateCSS(allVariants);

	return { variants: allVariants, modifiedFiles: modifiedCount, refLocations: globalRefTracker.getAllRefs() };
}

/**
 * Vite plugin example
 */
export function createViteUIPlugin() {
	let refTracker: any;
	let variants: any[];

	return {
		name: 'vite-ui-data-attributes',
		buildStart() {
			// Initialize on build start
			console.log('🚀 Initializing UI data attribute injection...');
		},
		async buildEnd() {
			// Extract variants from all processed files
			const files = await glob('src/**/*.{ts,tsx,js,jsx}');
			variants = extractVariantsFromFiles(files);
			refTracker = globalRefTracker;

			console.log('📊 Extracted variants:', variants);
		},
		transform(code: string, id: string) {
			// Only process relevant files
			if (!/\.(tsx?|jsx?)$/.test(id)) return null;

			// Check if this file has any ref locations
			const refLocations = refTracker?.getRefsByFile(id) || [];
			if (refLocations.length === 0) return null;

			// Inject data attributes
			try {
				const { injectDataAttributes } = require('./data_attribute_injector');
				const transformedCode = injectDataAttributes(code, refLocations, variants || [], SEMANTIC_CONFIG);

				return {
					code: transformedCode,
					map: null, // You might want to generate source maps
				};
			} catch (error) {
				console.error('Error injecting data attributes:', error);
				return null;
			}
		},
	};
}

/**
 * Webpack loader example
//  */
// export function createWebpackUILoader() {
// 	return function uiDataAttributeLoader(source: string) {
// 		const callback = this.async();
// 		const resourcePath = this.resourcePath;

// 		// Only process relevant files
// 		if (!/\.(tsx?|jsx?)$/.test(resourcePath)) {
// 			return callback(null, source);
// 		}

// 		try {
// 			// Get ref locations for this file
// 			const refLocations = globalRefTracker.getRefsByFile(resourcePath);

// 			if (refLocations.length === 0) {
// 				return callback(null, source);
// 			}

// 			// Get all variants (you'd need to make this available globally)
// 			const variants = []; // This would come from your build context

// 			const { injectDataAttributes } = require('./data_attribute_injector');
// 			const transformedSource = injectDataAttributes(source, refLocations, variants, SEMANTIC_CONFIG);

// 			callback(null, transformedSource);
// 		} catch (error) {
// 			callback(error);
// 		}
// 	};
// }

/**
 * Generate CSS based on variants
 * TODO MAKE ONE GLOBAL GENERATE CSS FILE Function
 * TODO MAKE ONE LOCAL GENERATE CSS FILE Function
 */
function generateCSS(variants: any[]) {
	const cssRules: string[] = [];

	for (const variant of variants) {
		for (const value of variant.values) {
			// Generate CSS for each variant value
			cssRules.push(`[data-ui-${variant.key}="${value}"] {
  /* Styles for ${variant.key}=${value} */
}`);
		}
	}

	const cssContent = cssRules.join('\n\n');
	writeFileSync('dist/ui-variants.css', cssContent);

	console.log('📝 Generated CSS with variant selectors');
}

/**
 * Example of the transformation result
 */
const EXAMPLE_TRANSFORMATION = `
// BEFORE:
<button ref={setTheme.ref} onClick={() => setTheme('dark')}>
  Toggle Theme
</button>

// AFTER:
<button ref={setTheme.ref} data-ui-theme="light" onClick={() => setTheme('dark')}>
  Toggle Theme
</button>
`;

console.log('Example transformation:', EXAMPLE_TRANSFORMATION);

// CLI usage example
if (require.main === module) {
	buildWithDataAttributes().catch(console.error);
}
