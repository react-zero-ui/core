---
summary: "Package/export boundaries, the previously observed workspace-protocol publishing failure, disabled release automation, and size measurements."
paths:
  - packages/core/package.json
  - packages/cli/package.json
  - packages/core/tsconfig.build.json
  - package.json
  - .npmrc
  - .github/workflows/release.yml.disable
  - scripts/write-size-badge.mjs
---

# Packages and Publishing

[Core's manifest](../../packages/core/package.json) owns public entry points and publish contents. Runtime hooks, Vite integration, CLI, and experimental helpers use ESM exports; the PostCSS export is CommonJS. [tsconfig.build.json](../../packages/core/tsconfig.build.json) emits `dist` and excludes source tests. Core's `prepack` rebuilds it. Preserve both module boundaries when changing packaging; fixture and smoke validation cover different consumer paths ([testing](build-test-ci.md)).

[create-zero-ui](../../packages/cli/package.json) ships its installer bin and depends on core through `workspace:^...`. The [setup page](core/setup-cli.md) owns installation behavior. Read manifests for versions and exact exports; historical memory is not a version source.

## Publishing constraint

Use `pnpm publish` for these workspace packages. Project memory records a prior consumer breakage from plain `npm publish` retaining the workspace dependency protocol. This constraint is especially consequential for the installer; preserve it in any release automation. [Historical evidence and reasoning](../decision-log.md).

[release.yml.disable](../../.github/workflows/release.yml.disable) is disabled by filename. It references absent `.release-please-config.json` and still invokes `npm publish` for both packages. Re-enabling it requires release configuration and publishing changes; removing the filename suffix alone is insufficient. The repository does not establish current external release state.

## Size artifacts

Build before measuring. Root `pnpm size` bundles core with React external, minifies production output, then gzips it. `pnpm size:badge` writes the README badge through [write-size-badge.mjs](../../scripts/write-size-badge.mjs). Refresh the badge when shipping a changed bundle. Experimental runtime has a separate size command; neither historical size prose nor an old badge proves a new artifact's size.
