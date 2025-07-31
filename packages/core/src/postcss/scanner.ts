// scanner.ts
export function scanVariantTokens(src: string, keys: Set<string>): Map<string, Set<string>> {
	/* 1.  bootstrap the output */
	const out = new Map<string, Set<string>>();
	keys.forEach((k) => out.set(k, new Set()));

	if (keys.size === 0) return out;

	/* 2.  tokenize exactly the same way Tailwind splits a class string
         (see  packages/tailwindcss/src/candidate.ts  →  TOK1 / TOK2)       */
	const TOK1 = /[^<>"'`\s]*[^<>"'`\s:]/g;
	const TOK2 = /[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g;
	const tokens = [...(src.match(TOK1) ?? []), ...(src.match(TOK2) ?? [])];

	if (tokens.length === 0) return out;

	/* 3.  longest-key-first prevents "modal" matching before "modal-visible" */
	const sortedKeys = [...keys].sort((a, b) => b.length - a.length);

	/* 4.  scan every token */
	for (const tokRaw of tokens) {
		// Split on ":" → everything **before** the final utility part
		const segments = tokRaw.split(':').slice(0, -1);

		for (const seg of segments) {
			for (const key of sortedKeys) {
				if (seg.startsWith(key + '-')) {
					const value = seg.slice(key.length + 1);
					if (value) out.get(key)!.add(value);
					break; // no smaller key can match
				}
			}
		}
	}

	return out;
}
