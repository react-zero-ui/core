# React Zero-UI Wiki — Index

Start here. Rules for maintaining this vault: `AGENTS.md`. Maintenance history: `log.md`.

## Orientation

- [[pages/React Zero-UI]] — what the product is, who it's for, the ecosystem (npm, zero-ui.dev, icon-sprite sibling repo).
- [[pages/Architecture Map]] — hub: monorepo layout, stack, layer → file map, one-paragraph data flow.

## Core Library

- [[pages/Core Library Internals]] — variant-extractor pipeline, static literal resolution, plugin entry points, hooks.
- [[pages/Experimental Runtime]] — SSR-safe `data-ui` click runtime (~300 B), status and design.

## Shipping

- [[pages/Packages and Publishing]] — the two npm packages, exports, the `pnpm publish` workspace-protocol gotcha, parked release automation.
- [[pages/Build Test and CI]] — tarball-based test model, test suites, CI + weekly compat workflow.

## Ecosystem & Ops

- [[pages/Docs and Website]] — `docs/*.md` vs the Fumadocs site in `examples/demo/` (zero-ui.dev), dead/duplicate doc files.
- [[pages/Operations Runbook]] — setup, sanity checks, where-to-start recipes for common tasks.
- [[pages/Open Questions and Risks]] — lint target: risks, unknowns, staleness watch, init assumptions.

## Ops & Raw

- `ops/Secret Handling.md` — no-secrets rules for this vault.
- `raw/source-manifest.md` — every ingested source + staleness notes.
