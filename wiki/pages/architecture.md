---
summary: "Ownership map across core, compiler, installer, fixture apps, and the docs website; generated attributes connect build and runtime."
paths:
  - pnpm-workspace.yaml
  - packages/core/package.json
  - packages/cli/package.json
---

# Architecture

[pnpm-workspace.yaml](../../pnpm-workspace.yaml) includes published packages and the private website. Core owns both runtime APIs and build/setup machinery; the separate installer delegates into core.

| Work area                                  | Owner and focused route                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Hook setters and scoped refs               | `packages/core/src/index.ts`, `internal.ts` — [runtime hooks](core/runtime-hooks.md)        |
| Source extraction, CSS, generated defaults | `packages/core/src/postcss/`, `config.ts` — [variant extractor](core/variant-extractor.md)  |
| Project installation and config patching   | `packages/cli/bin.js` → `packages/core/src/cli/` — [setup CLI](core/setup-cli.md)           |
| Server-rendered click directives           | `packages/core/src/experimental/` — [experimental runtime](core/experimental-runtime.md)    |
| Published artifacts and fixture validation | [Packages and publishing](packages-publishing.md), [build, tests, and CI](build-test-ci.md) |
| GitHub docs and zero-ui.dev                | `docs/` and `examples/demo/` — [docs and website](docs-website.md)                          |

Build/setup runs in the consuming app's working directory. The compiler finds declarations and variant tokens, then emits CSS and `.zero-ui/attributes.{js,d.ts}`. Next layouts spread generated `bodyAttributes`; Vite's HTML hook injects them. Runtime setters change the same attributes that generated selectors observe. Generated `variantKeyMap` also gates experimental click handling.

Treat `.zero-ui/` as compiler output, including checked-in fixture examples. Edit its producer or source declarations when changing behavior. Config patching and ordinary compilation share these producers; only explicit setup rewrites application config.
