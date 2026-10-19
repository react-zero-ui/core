---
summary: "October 2026 source probe confirming stale AST reuse after equal-length edits and clearCache, plus function-scoped const resolution."
---

# Compiler Cache Probe — 2026-10-19

Executed from repository root against `packages/core/src/postcss/ast-parsing.ts`, using installed Node/tsx. No application files changed. Filenames below are cache identities; no temporary source files are created.

```bash
node --import tsx --input-type=module <<'JS'
import { parseJsLike, collectUseUIHooks, clearCache } from './packages/core/src/postcss/ast-parsing.ts';
const first = 'const [, setTheme] = useUI("theme", "light");';
const edited = 'const [, setTheme] = useUI("theme", "black");';
const filename = '/tmp/wiki-migration-cache-check.tsx';
const before = collectUseUIHooks(parseJsLike(first, filename), first)[0].initialValue;
clearCache();
const after = collectUseUIHooks(parseJsLike(edited, filename), edited)[0].initialValue;
const local = 'function Demo() { const theme = "light"; const [, setTheme] = useUI("theme", theme); }';
const scoped = collectUseUIHooks(parseJsLike(local, '/tmp/wiki-migration-local-const-check.tsx'), local)[0].initialValue;
console.log(JSON.stringify({ equalLengthEdits: first.length === edited.length, before, afterClearCache: after, expectedEditedValue: 'black', functionScopedConst: scoped }));
JS
```

Observed output:

```json
{"equalLengthEdits":true,"before":"light","afterClearCache":"light","expectedEditedValue":"black","functionScopedConst":"light"}
```

Interpretation: `clearCache()` does not invalidate the AST cached for equal-length source under one filename. Function-scoped static constants resolve successfully. This was a focused source probe, not a browser/HMR integration test.
