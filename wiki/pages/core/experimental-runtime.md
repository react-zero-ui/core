---
summary: "Server-rendered data-ui directives, compiler-provided key gating, explicit browser activation, and scoped click targeting."
paths:
  - packages/core/src/experimental/
  - packages/core/src/config.ts
  - packages/core/src/postcss/ast-parsing.ts
  - packages/core/src/postcss/helpers.ts
  - packages/core/package.json
---

# Experimental Runtime

[experimental/index.ts](../../../packages/core/src/experimental/index.ts) exports `zeroSSR.onClick` and `scopedZeroSSR.onClick`. They return `data-ui` props; server components can emit interaction intent without installing React event handlers. Browser behavior still requires explicit activation of [experimental/runtime.ts](../../../packages/core/src/experimental/runtime.ts), kept in a separate package export.

## Compiler and runtime agreement

The [compiler](variant-extractor.md) recognizes both helpers by name. Keys and array elements must resolve statically; the value list must be an array expression. Its first value becomes the compiler's default. Tailwind variants still come from tokens in scanned source.

`activateZeroUiRuntime(variantKeyMap)` uses the generated map to admit known keys. The map gates keys, not individual directive values. Activation is a server no-op; in the browser, `window.__zero` allows one document click listener. The first activation captures the map, so later calls do not replace it.

On click, the listener finds the nearest `data-ui` host and cycles its value list. Global directives mutate body attributes. Scoped directives target the closest element carrying that `data-*` attribute, falling back to the host. Render the scoped initial attribute explicitly; the compiler does not seed it on that element.

Representative caller: [Next test page](../../../packages/core/__tests__/fixtures/next/app/test/page.tsx). Activation wrapper: [init-zero-ui.tsx](../../../packages/core/__tests__/fixtures/next/app/init-zero-ui.tsx). Behavior assertions: [next-ssr.spec.js](../../../packages/core/__tests__/e2e/next-ssr.spec.js).

API remains labeled experimental in [its README](../../../packages/core/src/experimental/README.md). The runtime export is the package's explicit `sideEffects` entry. Treat the older ~300-byte claim as a measurement to repeat with `pnpm size:experimental-runtime` after building, not a fixed size guarantee; see [publishing](../packages-publishing.md).
