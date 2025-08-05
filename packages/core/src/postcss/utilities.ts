export function formatError(err: unknown) {
	const error = err instanceof Error ? err : new Error(String(err));
	const eWithLoc = error as Error & { loc?: { file?: string; line?: number; column?: number } };

	/* ❶ Special-case throwCodeFrame errors (they always contain "^") */
	const isCodeFrame = /[\n\r]\s*\^/.test(error.message);

	/* ❷ Broader categories for non-frame errors (kept from your code) */
	const isSyntaxError =
		!isCodeFrame &&
		(error.message.includes('State key cannot be resolved') ||
			error.message.includes('initial value cannot be resolved') ||
			error.message.includes('SyntaxError'));
	const isFileError = !isCodeFrame && (error.message.includes('ENOENT') || error.message.includes('Cannot find module'));

	let friendly = error.message;
	if (isCodeFrame)
		friendly = error.message; // already perfect
	else if (isSyntaxError) friendly = `Syntax error in Zero-UI usage: ${error.message}`;
	else if (isFileError) friendly = `File system error: ${error.message}`;

	return { friendly, loc: eWithLoc.loc };
}

export type Result = {
	messages: { type: string; plugin: string; file: string; parent: string }[];
	opts: { from: string };
	prepend: (css: string) => void;
	warn: (message: string, options?: { endIndex?: number; index?: number; node?: Node; plugin?: string; word?: string }) => void;
};

export function registerDeps(result: Result, plugin: string, files: string[], parent: string) {
	files.forEach((file) => {
		result.messages.push({ type: 'dependency', plugin, file, parent });
	});
}
