# Core Library Internals

## What This Is

The variant-extractor pipeline and runtime hooks inside `@react-zero-ui/core`. Verified 2026-07-07 against `packages/core/src/`.

## Pipeline (build time)

1. **Phase A — collect hooks**: `collectUseUIHooks` in `packages/core/src/postcss/ast-parsing.ts` does one Babel AST traversal per file, validates `useUI(stateKey, initialValue)` shapes, and resolves both args to static strings.
2. **Static resolution**: everything funnels through `literalFromNode` (`packages/core/src/postcss/resolvers.ts`) — a deterministic mini-evaluator. Accepts string/template literals, local top-level `const`, const object/array member access, `||`/`??`, optional chaining, `as const`. Rejects imports, `let`/`var`, function calls, non-strings. Errors use `@babel/code-frame` via `throwCodeFrame`.
3. **Phase B — token scan**: `scanVariantTokens` in `packages/core/src/postcss/scanner.ts` regex-scans all project files for `key-value:` variant tokens matching any discovered state key.
4. **Emit**: `packages/core/src/postcss/helpers.ts` builds `@custom-variant` CSS (global selector targets `body[data-key='value']`; scoped targets the element) and `generateAttributesFile` writes `.zero-ui/attributes.js` (+ `.d.ts`) for SSR body-attribute injection.
5. Performance: LRU file cache keyed on `mtime:size`, parallel parsing (`os.cpus().length - 1`).

> Staleness note: `packages/core/ARCHITECTURE.md` and `docs/internal.md` cite these files as `.cts` (e.g. `ast-parsing.cts`). The sources are `.ts`; only the PostCSS entry `index.cts` and `traverse.cjs` are CJS.

## Entry points

- PostCSS plugin: `packages/core/src/postcss/index.cts` (published as `@react-zero-ui/core/postcss`, CJS). It **warns** if `.zero-ui` isn't initialized and tells the user to run `react-zero-ui` — it deliberately does not auto-run init (decision recorded in `.codex/project-memory.md`).
- Vite plugin: `packages/core/src/postcss/vite.ts` (`@react-zero-ui/core/vite`) — registers the PostCSS plugin plus Tailwind, and injects `bodyAttributes` into `index.html` via `transformIndexHtml`.
- Runtime hooks: `packages/core/src/index.ts`. `useUI` targets `document.body`; `useScopedUI` targets a ref element (`setTheme.ref`). Returned value is the **stale initial value** — hooks are write-only by design. `CssVar` flag switches from `data-*` attributes to CSS variables.
- Shared constants (hook names, `.zero-ui` dir, content globs): `packages/core/src/config.ts`.

## Decisions

- State keys/values must resolve at build time; cross-file constants and runtime values are rejected on purpose — the whole model depends on knowing every state up front.
- Unit tests live next to sources (`src/postcss/*.test.ts`, run with `tsx --test`).

## Related

- [[pages/Architecture Map]]
- [[pages/Experimental Runtime]]
- [[pages/Build Test and CI]]
