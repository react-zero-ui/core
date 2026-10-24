# Decision Log

## 2026-04-06 — Workspace-aware publishing prevents repeated consumer breakage

Project memory reports that plain `npm publish` previously broke consumers by retaining the installer's `workspace:` dependency. Preserve pnpm's workspace rewriting when replacing manual publishing or restoring automation. The current workflow achieves this with `pnpm pack` and publishes only the resulting validated tarball using npm OIDC; `pnpm publish` was the earlier manual constraint. This is a recorded failure, not just a package-manager preference. [Preserved project memory](raw/project-memory-2026-04-06.md).

## 2026-04-06 — Initialization belongs to explicit setup

PostCSS stopped auto-running CLI initialization; explicit setup paths own application config changes. Preserve this boundary when handling missing generated output: ordinary compilation may regenerate attributes without silently rewriting host application config. [Preserved decision](raw/project-memory-2026-04-06.md); [current setup ownership](pages/core/setup-cli.md).

## 2026-10-19 — Warm parser state can invalidate cache-reset assumptions

A direct source probe changed an initial value from `light` to `black` at the same filename, called `clearCache()`, and still observed `light`. The inner AST cache survives that reset. Reproduction of watch-mode bugs must include warm-process edits; cold runs alone can miss this failure. [Captured probe](raw/compiler-cache-probe.md); [current compiler context](pages/core/variant-extractor.md).

## 2026-10-19 — Remove the unpatched glob dependency chain from core

Consumers reported `fast-glob` → `micromatch` → `braces` through core. At review, the [stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) had no patched `braces` release, and core already used the latest upstream versions. npm's suggested fix downgraded core to `0.1.0`. Replaced the two internal glob calls with `tinyglobby`, preserving current source/layout matching and public APIs. Explicitly disabled its directory expansion default; retained existing hidden-file, ignore, and symlink policies. A fresh install of packed core had none of those three packages and reported zero npm audit vulnerabilities.

## 2026-10-19 — Keep Node 22 support when choosing the glob implementation

After comparing native glob with both scans, the user chose to retain `tinyglobby` and fix its handling of symlinked source roots. Native glob required exclusion workarounds in the probes, and its directory-symlink support needed by Next layout discovery is available from Node 24.16 / 26.1, not Node 22. Preserving Node 22 with native glob would require extra traversal logic. Separate source-pattern scans restore the old root-symlink behavior without changing the Node requirement or following nested symlinks. [Native API history](https://nodejs.org/docs/latest-v24.x/api/fs.html#fsglobsyncpattern-options); [scan contract](pages/core/variant-extractor.md).

## 2026-10-24 — Inspect stylesheet directives before injecting variants

Reproduced Next.js local-font parsing warnings with a packed core fixture. Zero UI injected Tailwind-only rules into generated font CSS, which [Tailwind deliberately skips](https://github.com/tailwindlabs/tailwindcss/blob/v4.2.2/packages/%40tailwindcss-postcss/src/index.ts#L86-L107). Gate injection by stylesheet directives rather than excluding `.module.css`: user modules may legitimately consume Zero UI variants. The regression checks both font loading and served CSS; successful rendering alone missed the warning. [Integration contract and tests](pages/core/variant-extractor.md).
