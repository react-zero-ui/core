// src/postcss/helpers.ts
import fs from 'fs';
import fg from 'fast-glob';
import path from 'path';
import { CONFIG, IGNORE_DIRS } from '../config.js';
import { parseJsonWithBabel, parseAndUpdatePostcssConfig, parseAndUpdateViteConfig } from './ast-generating.js';
import { VariantData } from './ast-parsing.js';

export interface ProcessVariantsResult {
	/** Array of deduplicated and sorted variant data */
	finalVariants: VariantData[];
	/** Object mapping data attributes to their initial values for body tag */
	initialValues: Record<string, string>;
	/** Array of source file paths that were processed */
	sourceFiles: string[];
}

export interface GenerateAttributesResult {
	/** Whether the JavaScript attributes file was changed */
	jsChanged: boolean;
	/** Whether the TypeScript definition file was changed */
	tsChanged: boolean;
}

export function toKebabCase(str: string): string {
	if (typeof str !== 'string') {
		throw new Error(`Expected string but got: ${typeof str}`);
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
		throw new Error(`Invalid state key/value "${str}". Only alphanumerics, underscores, and dashes are allowed.`);
	}
	return str
		.replace(/_/g, '-')
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.toLowerCase();
}

/** Return *absolute* paths of every JS/TS file we care about (à la Tailwind). */
export function findAllSourceFiles(patterns: string[] = CONFIG.CONTENT, cwd: string = process.cwd()): string[] {
	return fg
		.sync(patterns, {
			cwd,
			ignore: IGNORE_DIRS, // <-- pass the actual ignore list
			absolute: true, // give back absolute paths
			onlyFiles: true, // skip directories
			followSymbolicLinks: false, // Tailwind does the same
			dot: false, // don't match dot-files (change if you need)
			unique: true, // guard against duplicates
		})
		.map((p) => path.resolve(p)); // normalize on Windows
}

export function buildCss(variants: VariantData[]): string {
	const lines = variants.flatMap(({ key, values }) => {
		if (values.length === 0) return [];
		const keySlug = toKebabCase(key);

		// Double-ensure sorted order, even if extractor didn't sort
		return [...values].sort().map((v) => {
			const valSlug = toKebabCase(v);

			return `@custom-variant ${keySlug}-${valSlug} {&:where(body[data-${keySlug}="${valSlug}"] *) { @slot; } [data-${keySlug}="${valSlug}"] &, &[data-${keySlug}="${valSlug}"] { @slot; }}`;
		});
	});

	return CONFIG.HEADER + '\n' + lines.join('\n') + '\n';
}

export async function generateAttributesFile(finalVariants: VariantData[], initialValues: Record<string, string>): Promise<GenerateAttributesResult> {
	const cwd = process.cwd();
	const ATTR_DIR = path.join(cwd, CONFIG.ZERO_UI_DIR);
	const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');
	const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

	// Generate JavaScript export
	const attrExport = `${CONFIG.HEADER}\nexport const bodyAttributes = ${JSON.stringify(initialValues, null, 2)};\n`;

	// Generate TypeScript definitions
	const toLiteral = (v: string) => (typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : v);
	const variantLines = finalVariants.map(({ key, values }) => {
		const slug = `data-${toKebabCase(key)}`;
		const union = values.length ? values.map(toLiteral).join(' | ') : 'string'; // ← fallback
		return `  "${slug}": ${union};`;
	});

	// Always include an index signature so TS doesn't optimize
	// the declaration away when no variants exist.
	if (variantLines.length === 0) {
		variantLines.push('  [key: string]: string;');
	}

	const typeLines = [CONFIG.HEADER, 'export declare const bodyAttributes: {', ...variantLines, '};', ''];
	const attrTypeExport = typeLines.join('\n');

	// Create directory if it doesn't exist
	fs.mkdirSync(ATTR_DIR, { recursive: true });

	// Only write if content has changed
	const writeIfChanged = (file: string, content: string): boolean => {
		const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
		if (existing !== content) {
			fs.writeFileSync(file, content);
			return true;
		}
		return false;
	};

	const jsChanged = writeIfChanged(ATTR_FILE, attrExport);
	const tsChanged = writeIfChanged(ATTR_TYPE_FILE, attrTypeExport);

	return { jsChanged, tsChanged };
}

export function isZeroUiInitialized(): boolean {
	const cwd = process.cwd();
	const ATTR_DIR = path.join(cwd, CONFIG.ZERO_UI_DIR);
	const ATTR_FILE = path.join(ATTR_DIR, 'attributes.js');
	const ATTR_TYPE_FILE = path.join(ATTR_DIR, 'attributes.d.ts');

	if (!fs.existsSync(ATTR_FILE) || !fs.existsSync(ATTR_TYPE_FILE)) {
		return false;
	}

	try {
		const attrContent = fs.readFileSync(ATTR_FILE, 'utf-8');
		const typeContent = fs.readFileSync(ATTR_TYPE_FILE, 'utf-8');

		return attrContent.includes('export const bodyAttributes') && typeContent.includes('export declare const bodyAttributes');
	} catch (error: unknown) {
		console.error('[Zero-UI] Error checking if Zero-UI is initialized:', error);
		return false;
	}
}

/**
 * Adds the @zero-ui/attributes path alias and ensures the generated .d.ts files
 * are inside the TypeScript program. Writes to ts/ jsconfig only if something
 * actually changes.
 */
export async function patchTsConfig(): Promise<void> {
	const cwd = process.cwd();

	const configFile = fs.existsSync(path.join(cwd, 'tsconfig.json')) ? 'tsconfig.json' : fs.existsSync(path.join(cwd, 'jsconfig.json')) ? 'jsconfig.json' : null;

	// Ignore Vite fixtures — they patch their own config
	const hasViteConfig = ['js', 'mjs', 'ts', 'mts'].some((ext) => fs.existsSync(path.join(cwd, `vite.config.${ext}`)));
	if (hasViteConfig) {
		console.log('[Zero-UI] Vite config found, skipping tsconfig patch');
		return;
	}

	if (!configFile) {
		return console.warn(`[Zero-UI] No ts/ jsconfig found in ${cwd}`);
	}

	const configPath = path.join(cwd, configFile);
	const raw = fs.readFileSync(configPath, 'utf8');
	const config = parseJsonWithBabel(raw) ?? {};

	config.compilerOptions ??= {};
	config.compilerOptions.baseUrl ??= '.';
	config.compilerOptions.paths ??= {};

	/* ---------- migrate misplaced include ---------- */
	if ('include' in config.compilerOptions && !config.include) {
		config.include = config.compilerOptions.include;
		delete config.compilerOptions.include;
	}

	let changed = false;

	/* ---------- alias ---------- */
	const expectedAlias = ['./.zero-ui/attributes.js'];
	if (
		!Array.isArray(config.compilerOptions.paths['@zero-ui/attributes']) ||
		JSON.stringify(config.compilerOptions.paths['@zero-ui/attributes']) !== JSON.stringify(expectedAlias)
	) {
		config.compilerOptions.paths['@zero-ui/attributes'] = expectedAlias;
		changed = true;
	}

	/* ---------- includes ---------- */
	const beforeInclude = config.include ?? [];
	const extraIncludes = ['.zero-ui/**/*.d.ts', '.next/**/*.d.ts'];
	config.include = Array.from(new Set([...beforeInclude, ...extraIncludes])).sort();
	if (!changed && JSON.stringify(config.include) !== JSON.stringify(beforeInclude.sort())) changed = true;

	/* ---------- write ---------- */
	const output = JSON.stringify(config, null, 2) + '\n';
	if (changed && output !== raw) {
		fs.writeFileSync(configPath, output);
		console.log(`[Zero-UI] Patched ${configFile} (paths + includes)`);
	}
}

/**
 * Patches postcss.config.js to include Zero-UI plugin before Tailwind CSS
 * Only runs for Next.js projects and uses AST parsing for robust config modification
 */
export async function patchPostcssConfig(): Promise<void> {
	const cwd = process.cwd();
	const postcssConfigJsPath = path.join(cwd, 'postcss.config.js');
	const postcssConfigMjsPath = path.join(cwd, 'postcss.config.mjs');
	const packageJsonPath = path.join(cwd, 'package.json');

	// Determine which config file exists (prefer .js over .mjs)
	let postcssConfigPath: string | null = null;
	let isESModule = false;

	if (fs.existsSync(postcssConfigJsPath)) {
		postcssConfigPath = postcssConfigJsPath;
		isESModule = false;
	} else if (fs.existsSync(postcssConfigMjsPath)) {
		postcssConfigPath = postcssConfigMjsPath;
		isESModule = true;
	}

	const zeroUiPlugin = '@react-zero-ui/core/postcss';

	let createMjs = false;

	if (fs.existsSync(packageJsonPath)) {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
		createMjs = packageJson.type === 'module';
	}

	// If no config exists, create a .js file (more widely supported)
	if (!postcssConfigPath) {
		const newConfigPath = createMjs ? postcssConfigMjsPath : postcssConfigJsPath;
		const configJs = `// postcss.config.js
module.exports = {
  plugins: {
    '${zeroUiPlugin}': {},
    // Tailwind MUST come AFTER Zero-UI
    '@tailwindcss/postcss': {}
  }
};
`;
		const configMjs = `// postcss.config.mjs
export default {
  plugins: {
    '${zeroUiPlugin}': {},
    // Tailwind MUST come AFTER Zero-UI
    '@tailwindcss/postcss': {}
  }
};
`;
		const newConfigJs = createMjs ? configMjs : configJs;
		fs.writeFileSync(newConfigPath, newConfigJs);
		console.log(`[Zero-UI] Created ${path.basename(newConfigPath)} with Zero-UI plugin`);
		return;
	}

	// Parse existing config using AST
	const existingContent = fs.readFileSync(postcssConfigPath, 'utf-8');
	const updatedConfig = parseAndUpdatePostcssConfig(existingContent, zeroUiPlugin, isESModule);

	if (updatedConfig && updatedConfig !== existingContent) {
		fs.writeFileSync(postcssConfigPath, updatedConfig);
		const configFileName = path.basename(postcssConfigPath);
		console.log(`[Zero-UI] Updated ${configFileName} to include Zero-UI plugin`);
	} else if (updatedConfig === null) {
		const configFileName = path.basename(postcssConfigPath);
		console.log(`[Zero-UI] PostCSS config exists but missing Zero-UI plugin.`);
		console.warn(`[Zero-UI] Please manually add "@react-zero-ui/core/postcss" before Tailwind in your ${configFileName}`);
	}
}

/**
 * Patches vite.config.ts/js to include Zero-UI plugin and replace Tailwind CSS v4+ plugin if present
 * Only runs for Vite projects and uses AST parsing for robust config modification
 */

export async function patchViteConfig(): Promise<void> {
	const cwd = process.cwd();
	const candidates = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs'];

	const viteConfigPath = candidates.map((f) => path.join(cwd, f)).find((p) => fs.existsSync(p));

	if (!viteConfigPath) return console.warn(`[Zero-UI] No vite.config.ts/js found in ${cwd}`); // not a Vite project

	const zeroUiImportPath = CONFIG.VITE_PLUGIN;
	const original = fs.readFileSync(viteConfigPath, 'utf8');

	const patched = parseAndUpdateViteConfig(original, zeroUiImportPath);

	if (patched && patched !== original) {
		fs.writeFileSync(viteConfigPath, patched);
		console.log(`[Zero-UI] Updated ${path.basename(viteConfigPath)} (added Zero-UI, removed Tailwind)`);
	}
}

/**
 * Check if the current project has Vite config files
 */
export function hasViteConfig(): boolean {
	const cwd = process.cwd();
	return ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs'].some((f) => fs.existsSync(path.join(cwd, f)));
}

/**
 * Concurrency helper (no external dep)
 * @param items - The items to process.
 * @param limit - The maximum number of concurrent executions.
 * @param fn - The function to execute for each item.
 * @returns A promise that resolves to an array of results.
 */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const out: R[] = [];
	let i = 0;
	let active = 0;
	return new Promise((resolve, reject) => {
		const launch = () => {
			if (i === items.length && active === 0) return resolve(out);
			while (active < limit && i < items.length) {
				const idx = i++;
				active++;
				fn(items[idx])
					.then((r) => {
						out[idx] = r;
					})
					.then(() => {
						active--;
						launch();
					})
					.catch(reject);
			}
		};
		launch();
	});
}
