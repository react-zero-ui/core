// src/postcss/index.cts
/**
 * @type {import('postcss').PluginCreator}
 */
type Root = { prepend: (css: string) => void };
type Result = {
	messages: { type: string; plugin: string; file: string; parent: string }[];
	opts: { from: string };
	prepend: (css: string) => void;
	warn: (message: string, options?: { endIndex?: number; index?: number; node?: Node; plugin?: string; word?: string }) => void;
};
type RuntimeModules = {
	buildCss: typeof import("./helpers.js").buildCss;
	generateAttributesFile: typeof import("./helpers.js").generateAttributesFile;
	isZeroUiInitialized: typeof import("./helpers.js").isZeroUiInitialized;
	processVariants: typeof import("./ast-parsing.js").processVariants;
	formatError: typeof import("./utilities.js").formatError;
	registerDeps: typeof import("./utilities.js").registerDeps;
};

const zeroUIPlugin = "postcss-react-zero-ui";
const warnedCwds = new Set<string>();
let runtimeModulesPromise: Promise<RuntimeModules> | null = null;

function loadRuntimeModules(): Promise<RuntimeModules> {
	if (!runtimeModulesPromise) {
		runtimeModulesPromise = Promise.all([import("./helpers.js"), import("./ast-parsing.js"), import("./utilities.js")]).then(
			([helpers, astParsing, utilities]) => ({
				buildCss: helpers.buildCss,
				generateAttributesFile: helpers.generateAttributesFile,
				isZeroUiInitialized: helpers.isZeroUiInitialized,
				processVariants: astParsing.processVariants,
				formatError: utilities.formatError,
				registerDeps: utilities.registerDeps,
			})
		);
	}

	return runtimeModulesPromise;
}

function warnIfNotInitialized(result: Result, isZeroUiInitialized: RuntimeModules["isZeroUiInitialized"]) {
	const cwd = process.cwd();

	if (isZeroUiInitialized() || warnedCwds.has(cwd)) {
		return;
	}

	warnedCwds.add(cwd);
	result.warn("[Zero-UI] Zero UI is not initialized. Run `react-zero-ui` to patch your project config.", { plugin: zeroUIPlugin });
}

const plugin = () => {
	return {
		postcssPlugin: zeroUIPlugin,
		async Once(root: Root, { result }: { result: Result }) {
			try {
				const { buildCss, generateAttributesFile, isZeroUiInitialized, processVariants, formatError, registerDeps } = await loadRuntimeModules();
				const { finalVariants, initialGlobalValues, sourceFiles } = await processVariants();

				const cssBlock = buildCss(finalVariants);
				if (cssBlock?.trim()) root.prepend(cssBlock + "\n");

				/* ── register file-dependencies for HMR ─────────────────── */
				registerDeps(result, zeroUIPlugin, sourceFiles, result.opts.from ?? "");

				warnIfNotInitialized(result, isZeroUiInitialized);
				await generateAttributesFile(finalVariants, initialGlobalValues);
			} catch (err: unknown) {
				const { formatError, registerDeps } = await loadRuntimeModules();
				const { friendly, loc } = formatError(err);
				if (process.env.NODE_ENV !== "production") {
					if (loc?.file) registerDeps(result, zeroUIPlugin, [loc.file], result.opts.from ?? "");
					result.warn(friendly, { plugin: zeroUIPlugin, ...loc });
					console.error("[Zero-UI] Full error (dev-only)\n", err);
					return; // keep dev-server alive
				}
				throw new Error(`[Zero-UI] PostCSS plugin error: ${friendly}`);
			}
		},
	};
};

plugin.postcss = true;
export = plugin;
