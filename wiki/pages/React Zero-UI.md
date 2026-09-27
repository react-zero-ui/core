# React Zero-UI

## What This Is

The product page: what React Zero-UI is, who it's for, and the ecosystem around it. Verified 2026-07-07.

## Current Facts

- React Zero-UI is a build-time React UI state library: state changes flip `data-*` attributes (or CSS variables) instead of triggering React re-renders. Tailwind variants like `theme-dark:bg-black` are generated at build time (`README.md`).
- Audience: React developers on Next.js (App Router) or Vite, using Tailwind v4 (`README.md` Quick Start prerequisites).
- Published packages: `@react-zero-ui/core` (library + PostCSS/Vite plugins + init CLI) and `create-zero-ui` (npx scaffolder). See [[pages/Packages and Publishing]].
- Positioning/tagline: "The fastest possible UI updates in React. Period." Zero runtime, zero re-renders. Bundle-size claims are backed by a measured badge — see `docs/size.md` and `.github/badges/core-size.json`.
- Website: `https://zero-ui.dev`, built from `examples/demo/` in this repo — see [[pages/Docs and Website]].
- Author/owner: Austin Serb (`austin1serb` on GitHub, sponsor link `https://www.serbyte.net/`). Canonical SEO/branding facts (site name, profiles, logo paths) live in `examples/demo/app/config/site-config.ts` — cite that file, don't duplicate it.
- Sibling project: `@react-zero-ui/icon-sprite` lives in a **separate repo** (`github.com/react-zero-ui/icon-sprite`), but the docs site showcases and depends on it (`examples/demo/package.json`, `examples/demo/app/(home)/icon-sprite/page.tsx`).
- License: MIT. Funding: GitHub Sponsors (`package.json` `funding`).

## Decisions

- Core philosophy (from `CONTRIBUTING.md`): "UI state should not require re-rendering. CSS and `data-*` attributes can be enough." Contributions should stay pre-rendered, declarative, and fast — no runtime state layers.
- All states must be statically resolvable at build time; dynamic values are rejected by design, not by limitation ([[pages/Core Library Internals]]).

## Risks / Open Questions

- See [[pages/Open Questions and Risks]].

## Related

- [[pages/Architecture Map]]
- [[pages/Packages and Publishing]]
- [[pages/Docs and Website]]
