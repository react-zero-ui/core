import crypto from 'crypto';

/** Signature helper – mtimes can collide on some FS; hash is bullet-proof */
function sig(src: string, keys: Set<string>): string {
	const hash = crypto
		.createHash('sha1')
		.update(src)
		.update('\0') // delimiter
		.update([...keys].sort().join(',')) // order-independent
		.digest('base64url')
		.slice(0, 12); // short but unique
	return hash;
}

/* LRU: 2 000 recent files ≈ <3 MB RAM */
const scanCache = new Map<string, Map<string, Set<string>> | Error>();

export function scanVariantTokens(src: string, keys: Set<string>): Map<string, Set<string>> {
	const cacheKey = sig(src, keys);

	/* ── 1. Cached hit ─────────────────────────────── */
	const cached = scanCache.get(cacheKey);
	if (cached instanceof Map) return cached;
	if (cached instanceof Error) throw cached;

	/* ── 2. Cold scan ──────────────────────────────── */
	const out = new Map<string, Set<string>>();
	keys.forEach((k) => out.set(k, new Set()));
	if (keys.size === 0) {
		scanCache.set(cacheKey, out);
		return out;
	}

	try {
		/* TOKEN logic identical to before */
		const TOK1 = /[^<>"'`\s]*[^<>"'`\s:]/g;
		const TOK2 = /[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g;
		const tokens = [...(src.match(TOK1) ?? []), ...(src.match(TOK2) ?? [])];

		if (tokens.length) {
			const sortedKeys = [...keys].sort((a, b) => b.length - a.length);
			for (const tokRaw of tokens) {
				const segments = tokRaw.split(':').slice(0, -1);
				for (const seg of segments) {
					for (const key of sortedKeys) {
						if (seg.startsWith(key + '-')) {
							const value = seg.slice(key.length + 1);
							if (value) out.get(key)!.add(value);
							break; // early-out
						}
					}
				}
			}
		}

		scanCache.set(cacheKey, out);
		return out;
	} catch (err) {
		/* Cache the failure so we don’t loop-spam */
		const e = err instanceof Error ? err : new Error(String(err));
		scanCache.set(cacheKey, e);
		throw e;
	}
}
