# Experimental Runtime

## What This Is

Status page for the experimental SSR-safe interactivity runtime (`zeroOnClick` / `data-ui`). Status: **shipped as experimental, ~300 bytes, opt-in**. Verified 2026-07-07.

## Current Facts

- Purpose: click-driven UI state in React *server* components without `use client` (`packages/core/src/experimental/README.md`, `docs/experimental.md`).
- `activateZeroUiRuntime()` (`packages/core/src/experimental/runtime.ts`) registers one global click listener; parses `data-ui="global:key(v1,v2)"` or `scoped:key(...)` directives and round-robins the matching `data-*` attribute. Guards double-init via `window.__zero`.
- `zeroSSR.onClick()` / `scopedZeroSSR.onClick()` (`packages/core/src/experimental/index.ts`) generate the `data-ui` props, with dev-only validation (kebab-case key, non-empty values).
- Published under `@react-zero-ui/core/experimental` and `/experimental/runtime`; the runtime file is the only `sideEffects` entry in `packages/core/package.json`.
- Size check: `pnpm size:experimental-runtime` (root `package.json`).
- Hook names `zeroSSR` / `scopedZeroSSR` are recognized by the build-time scanner via `packages/core/src/config.ts` (`SSR_HOOK_NAME`).

## Decisions

- Kept out of the main entry so the core "zero runtime" claim stays true; users explicitly import and pay ~300 bytes.

## Risks / Open Questions

- Experimental API may change; docs (`docs/experimental.md`) and README both flag it. No deprecation/stabilization timeline recorded anywhere.

## Related

- [[pages/Core Library Internals]]
- [[pages/Packages and Publishing]]
