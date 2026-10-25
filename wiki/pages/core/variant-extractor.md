---
summary: "Declaration-to-CSS pipeline, static resolution boundaries, generated SSR attributes, plugin failures, and cache invalidation traps."
paths:
  - packages/core/src/config.ts
  - packages/core/src/postcss/ast-parsing.ts
  - packages/core/src/postcss/resolvers.ts
  - packages/core/src/postcss/scanner.ts
  - packages/core/src/postcss/helpers.ts
  - packages/core/src/postcss/index.cts
  - packages/core/src/postcss/vite.ts
  - packages/core/src/postcss/utilities.ts
  - packages/core/__tests__/unit/index.test.cjs
  - packages/core/__tests__/e2e/next-ssr.spec.js
  - packages/core/__tests__/fixtures/next/app/layout.tsx
---

# Variant Extractor

## Pipeline and owners

1. [config.ts](../../../packages/core/src/config.ts) defines recognized names and source globs. [helpers.ts](../../../packages/core/src/postcss/helpers.ts) discovers app files relative to `process.cwd()`.
2. [ast-parsing.ts](../../../packages/core/src/postcss/ast-parsing.ts) collects declarations. Hook calls must use recognized identifier names and destructure a two-slot tuple with a named setter; recognition does not resolve import aliases. It also recognizes `zeroSSR.onClick` and `scopedZeroSSR.onClick`.
3. [resolvers.ts](../../../packages/core/src/postcss/resolvers.ts) resolves keys/initial values from local static expressions. Local `const` includes function scope. Numeric/boolean literals can be coerced by the evaluator even though public hook types require strings. Imported values, mutable bindings, and unresolved runtime expressions are outside the supported contract.
4. [scanner.ts](../../../packages/core/src/postcss/scanner.ts) scans text for `key-value:` tokens using all discovered keys. Tokens can live in other source or style files; setter calls are not an enumeration of CSS states.
5. `processVariants` aggregates keys, rejects conflicting initial values or mixed global/scoped use, and sorts output. `buildCss` emits Tailwind `@custom-variant` rules. Global selectors depend on body attributes; scoped selectors match the owning element and descendants.

Source and Next layout discovery use `tinyglobby`. Source discovery scans each positive pattern separately, applies all negative patterns to every scan, and deduplicates absolute paths. This preserves symlinked `src`, `app`, and `pages` roots while skipping links encountered below those roots; combining the patterns into one crawl would skip the linked roots too. Keep `expandDirectories: false`: literal directory patterns must not silently become recursive searches. [Dependency migration rationale](../../decision-log.md).

`generateAttributesFile` owns `.zero-ui/attributes.js` and its declaration file. `bodyAttributes` contains global defaults; `variantKeyMap` includes global and scoped keys. Writes occur only when content changes. Scoped initial attributes remain a [markup responsibility](runtime-hooks.md).

## Integration and failure behavior

[index.cts](../../../packages/core/src/postcss/index.cts) is the CommonJS PostCSS entry; it lazily imports ESM helpers. Run Zero-UI before Tailwind so custom variants exist when Tailwind processes utilities. It registers source dependencies for watch mode, warns once per working directory when initialization is missing, and still generates attributes. Application config changes belong to [explicit setup](setup-cli.md).

Variant injection requires a directive recognized by Tailwind's PostCSS early-bail check: `@import`, `@reference`, `@theme`, `@variant`, `@config`, `@plugin`, `@apply`, or `@tailwind`. Plain stylesheets, including `next/font/local` generated CSS modules, stay unchanged; attribute generation and dependency registration still run. `@custom-variant` alone does not trigger Tailwind compilation, so unconditional injection leaks it and `@slot` into Next's CSS parser. Preserve CSS modules using Tailwind directives; filename exclusion would block legitimate variants. [PostCSS integration tests](../../../packages/core/__tests__/unit/index.test.cjs) cover both paths; [Next fixture tests](../../../packages/core/__tests__/e2e/next-ssr.spec.js) check local-font loading and served CSS.

Development extraction failures become warnings and leave the server alive; production failures throw. A running dev server alone does not establish that variants compiled successfully. [vite.ts](../../../packages/core/src/postcss/vite.ts) adds Zero-UI/Tailwind to PostCSS and reads generated attributes during HTML transformation; missing startup output can therefore fail before later CSS generation helps.

## Cache debugging

The file cache uses `mtime:size`; token scanning has a separate content-and-key signature. `parseJsLike` has another cache keyed only by filename and source length. Equal-length edits can reuse an old AST even after `clearCache()`, which clears only the file cache. Confirmed with a `light` → `black` edit; [probe and result](../../raw/compiler-cache-probe.md). Include process restarts when diagnosing watch-mode differences.

Tests sit beside these sources: [AST collection](../../../packages/core/src/postcss/ast-parsing.test.ts), [resolution](../../../packages/core/src/postcss/resolvers.test.ts), and [scanning](../../../packages/core/src/postcss/scanner.test.ts). Older `ARCHITECTURE.md` / `docs/internal.md` use stale `.cts` filenames; current extraction modules are `.ts`.
