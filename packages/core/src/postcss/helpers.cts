// src/postcss/helpers.cts
import fs from 'fs';
import path from 'path';
import { CONFIG, IGNORE_DIRS } from '../config.cjs';
import { parseJsonWithBabel, parseAndUpdatePostcssConfig, parseAndUpdateViteConfig } from './ast-v2.cjs';
import { extractVariants, VariantData } from './ast-v2.cjs';

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

export function findAllSourceFiles(patterns: string[] = CONFIG.CONTENT): string[] {
	const { globSync } = require('glob');
	const cwd = process.cwd();

	try {
		return globSync(patterns, { cwd, ignore: Array.from(IGNORE_DIRS), absolute: true });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.warn('[Zero-UI] Error finding source files:', errorMessage);
		return [];
	}
}

/**
 * Process all variants from source files and return deduplicated, sorted variants.
 * This is the core processing logic used by both PostCSS plugin and init script.
 */
export async function processVariants(files: string[] | null = null): Promise<ProcessVariantsResult> {
	const sourceFiles = files || findAllSourceFiles();
	const allVariants = sourceFiles.flatMap((file) => {
		return extractVariants(file);
	});

	// Deduplicate and merge variants
	const variantMap = new Map<string, Set<string>>();
	const initialValueMap = new Map<string, string>();

	for (const variant of allVariants) {
		const { key, values, initialValue } = variant;

		if (!variantMap.has(key)) {
			variantMap.set(key, new Set());
			if (initialValue !== null && initialValue !== undefined) {
				initialValueMap.set(key, initialValue);
			}
		}

		if (Array.isArray(values)) {
			values.forEach((v) => variantMap.get(key)!.add(v));
		}
	}

	// Convert to final format
	const finalVariants: VariantData[] = Array.from(variantMap.entries())
		.map(([key, set]) => ({ key, values: Array.from(set).sort(), initialValue: initialValueMap.get(key) || null }))
		.sort((a, b) => a.key.localeCompare(b.key));

	// Generate initial values object
	const initialValues: Record<string, string> = {};
	for (const { key, values, initialValue } of finalVariants) {
		const keySlug = toKebabCase(key);
		initialValues[`data-${keySlug}`] = initialValue || values[0] || '';
	}

	return { finalVariants, initialValues, sourceFiles };
}

export function buildCss(variants: VariantData[]): string {
	const lines = variants.flatMap(({ key, values }) => {
		if (values.length === 0) return [];
		const keySlug = toKebabCase(key);

		// Double-ensure sorted order, even if extractor didn't sort
		return [...values].sort().map((v) => {
			const valSlug = toKebabCase(v);

			return `@custom-variant ${keySlug}-${valSlug} {
  &:where(body[data-${keySlug}="${valSlug}"] *) { @slot; }
  [data-${keySlug}="${valSlug}"] &, &[data-${keySlug}="${valSlug}"] { @slot; }
}`;
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
export async function patchConfigAlias(): Promise<void> {
	const cwd = process.cwd();

	const configFile = fs.existsSync(path.join(cwd, 'tsconfig.json')) ? 'tsconfig.json' : fs.existsSync(path.join(cwd, 'jsconfig.json')) ? 'jsconfig.json' : null;

	// Ignore Vite fixtures — they patch their own config
	if (fs.existsSync(path.join(cwd, 'vite.config.ts'))) return;
	if (!configFile) {
		return console.warn(`[Zero-UI] No ts/ jsconfig found in ${cwd}`);
	}

	const configPath = path.join(cwd, configFile);
	const raw = fs.readFileSync(configPath, 'utf-8');
	const config = parseJsonWithBabel(raw);
	if (!config) {
		return console.warn(`[Zero-UI] Could not parse ${configFile}`);
	}

	/* ---------- ensure alias ---------- */
	config.compilerOptions ??= {};
	config.compilerOptions.baseUrl ??= '.';
	config.compilerOptions.paths ??= {};

	const expectedPaths = ['./.zero-ui/attributes.js'];
	const currentPaths = config.compilerOptions.paths['@zero-ui/attributes'];
	let changed = false;

	if (!Array.isArray(currentPaths) || JSON.stringify(currentPaths) !== JSON.stringify(expectedPaths)) {
		config.compilerOptions.paths['@zero-ui/attributes'] = expectedPaths;
		changed = true;
	}

	/* ---------- ensure .d.ts includes ---------- */
	const extraIncludes = ['.zero-ui/**/*.d.ts', '.next/**/*.d.ts'];
	config.include = Array.from(new Set([...(config.include ?? []), ...extraIncludes]));

	if (config.include.length !== (config.include ?? []).length) {
		changed = true;
	}

	/* ---------- write only if modified ---------- */
	if (changed) {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
		console.log(`[Zero-UI] Patched ${configFile} (paths &/or includes)`);
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
	const viteConfigTsPath = path.join(cwd, 'vite.config.ts');
	const viteConfigJsPath = path.join(cwd, 'vite.config.js');
	const viteConfigMjsPath = path.join(cwd, 'vite.config.mjs');

	// Determine which config file exists (prefer .ts over .js)
	let viteConfigPath: string | undefined;

	if (fs.existsSync(viteConfigTsPath)) {
		viteConfigPath = viteConfigTsPath;
	} else if (fs.existsSync(viteConfigJsPath)) {
		viteConfigPath = viteConfigJsPath;
	} else if (fs.existsSync(viteConfigMjsPath)) {
		viteConfigPath = viteConfigMjsPath;
	} else {
		return; // No Vite config found, skip patching
	}

	const zeroUiPlugin = '@react-zero-ui/core/vite';

	try {
		// Read existing config
		const existingContent = fs.readFileSync(viteConfigPath, 'utf-8');

		// Parse and update config using AST
		const updatedConfig = parseAndUpdateViteConfig(existingContent, zeroUiPlugin);

		if (updatedConfig && updatedConfig !== existingContent) {
			fs.writeFileSync(viteConfigPath, updatedConfig);
			const configFileName = path.basename(viteConfigPath);
			console.log(`[Zero-UI] Updated ${configFileName} with Zero-UI plugin`);

			// Check if Tailwind was replaced
			if (existingContent.includes('@tailwindcss/vite')) {
				console.log(`[Zero-UI] Replaced @tailwindcss/vite with Zero-UI plugin`);
			}
		} else if (updatedConfig === null) {
			const configFileName = path.basename(viteConfigPath);
			console.log(`[Zero-UI] Could not automatically update ${configFileName}`);
			console.log(`[Zero-UI] Please manually add "import zeroUI from '${zeroUiPlugin}'" and "zeroUI()" to your plugins array`);
		}
		// If updatedConfig === existingContent, config is already properly configured
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('[Zero-UI] Error patching Vite config:', errorMessage);
	}
}

/**
 * Check if the current project has Vite config files
 */
export function hasViteConfig(): boolean {
	const cwd = process.cwd();
	const viteConfigFiles = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'];
	return viteConfigFiles.some((configFile) => fs.existsSync(path.join(cwd, configFile)));
}
