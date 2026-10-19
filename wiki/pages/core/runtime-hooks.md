---
summary: "Write-only hook tuples, DOM-owned state, scoped ref initialization, and the cssVar path."
paths:
  - packages/core/src/index.ts
  - packages/core/src/internal.ts
---

# Runtime Hooks

[index.ts](../../../packages/core/src/index.ts) owns `useUI`, `useScopedUI`, and the public `cssVar` export. [internal.ts](../../../packages/core/src/internal.ts) owns setter construction and DOM mutation.

## State contract

- Tuple's first slot is the supplied initial value, never a subscription to current DOM state. Setters do not trigger React renders. Render alternate states up front and let CSS select visibility.
- Functional updates read the target's current dataset value or inline CSS variable, falling back to the captured initial value. The DOM owns mutable state; no React store synchronizes it.
- `useRef` preserves the first setter. Its key, initial value, and mode are captured at construction; changing hook arguments on later renders does not reconfigure that setter.
- `useUI` targets `document.body`. Passing `cssVar` switches the write from `data-*` to `style.setProperty('--key', value)`. CSS-variable initial presentation belongs in CSS/markup; constructing a setter does not initialize the style.

## Scoped elements

Attach `setter.ref` to one element and render that element's initial `data-*` value. Ref attachment records the target; it does not seed attributes. See the [FAQ fixture](../../../packages/core/__tests__/fixtures/next/app/FAQ.tsx). Setters need the ref attached before browser use. Separate component instances can share a key while retaining separate DOM state, but the [compiler](variant-extractor.md) still requires matching initial values and scope across that key.

Setters return without DOM access on the server. Development validation checks names/values, reports inconsistent initial values, and detects multiple scoped ref attachments.

For observable behavior, use [Vite scope tests](../../../packages/core/__tests__/e2e/vite-scopes.spec.js) and the active [Next fixture tests](../../../packages/core/__tests__/e2e/next-ssr.spec.js). Suite selection and artifact preparation live in [build, tests, and CI](../build-test-ci.md).
