# Architecture Map

## What This Is

The hub page: monorepo layout, stack, and where each layer lives. Verified 2026-07-07.

## Stack

- pnpm monorepo (`pnpm-workspace.yaml`: `packages/*` + `examples/*`), Node >= 22, TypeScript ~5.9, ESM-first (`"type": "module"` everywhere).
- `packageManager: pnpm@11.3.0` in root `package.json` (but CI pins 10.12.1 — see [[pages/Open Questions and Risks]]).
- Core deps: Babel toolchain (parse/traverse/generate), `fast-glob`, `lru-cache`. Peer deps: React >= 16.8, `@tailwindcss/postcss` ^4.1 (`packages/core/package.json`).

## Layers

| Layer | Where | Detail page |
| --- | --- | --- |
| Runtime hooks (`useUI`, `useScopedUI`, `CssVar`) | `packages/core/src/index.ts`, `internal.ts` | [[pages/Core Library Internals]] |
| Build-time variant extractor (AST + scan) | `packages/core/src/postcss/` | [[pages/Core Library Internals]] |
| PostCSS plugin entry (CJS) | `packages/core/src/postcss/index.cts` | [[pages/Core Library Internals]] |
| Vite plugin (wraps PostCSS + injects body attrs) | `packages/core/src/postcss/vite.ts` | [[pages/Core Library Internals]] |
| Init CLI (config patcher) | `packages/core/src/cli/init.ts` | [[pages/Packages and Publishing]] |
| Scaffolder `create-zero-ui` | `packages/cli/bin.js` | [[pages/Packages and Publishing]] |
| Experimental SSR runtime (`zeroSSR`, `data-ui`) | `packages/core/src/experimental/` | [[pages/Experimental Runtime]] |
| Markdown docs | `docs/*.md` | [[pages/Docs and Website]] |
| Docs website (zero-ui.dev, Next.js + Fumadocs) | `examples/demo/` | [[pages/Docs and Website]] |
| Tests (unit + Playwright e2e vs fixtures) | `packages/core/__tests__/`, `packages/core/src/**/*.test.ts` | [[pages/Build Test and CI]] |
| Dev playground (Next.js) | `packages/core/dev/next/` | [[pages/Build Test and CI]] |

## Data Flow (one paragraph)

At build time the PostCSS plugin parses source files for `useUI`/`useScopedUI` calls, statically resolves state keys and initial values, regex-scans all files for matching Tailwind variant tokens, emits `@custom-variant` CSS, and writes `.zero-ui/attributes.js` so SSR (Next layout or the Vite `transformIndexHtml` hook) can stamp initial `data-*` attributes on `<body>` with no FOUC. At runtime the hooks just flip attributes on `body` or a scoped ref element — no React state, no re-renders.

## Project Status

- Actively maintained solo OSS project. Current focus per `.codex/project-memory.md` (2026-04): docs/release alignment, compat automation, docs-site improvements.

## Related

- [[pages/React Zero-UI]]
- [[pages/Operations Runbook]]
