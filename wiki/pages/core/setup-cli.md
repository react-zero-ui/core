---
summary: "Installer-to-core handoff, current-working-directory ownership, framework detection, and limits of automatic config/layout patching."
paths:
  - packages/cli/bin.js
  - packages/core/src/cli/
  - packages/core/src/postcss/ast-generating.ts
  - packages/core/src/postcss/helpers.ts
---

# Setup CLI

[packages/cli/bin.js](../../../packages/cli/bin.js) owns package-manager detection and dependency installation for `create-zero-ui`. It installs core and Tailwind's PostCSS package, then imports `@react-zero-ui/core/cli`. [init.ts](../../../packages/core/src/cli/init.ts) is an entry wrapper; [postInstall.ts](../../../packages/core/src/cli/postInstall.ts) owns the actual setup sequence. Ordinary PostCSS compilation does not invoke it.

## Setup sequence

Vite-config presence selects the Vite path. Other projects get TS/JS config aliases and PostCSS patching, followed by Next-style layout injection. Both paths run the [shared compiler](variant-extractor.md) and write generated attributes.

[helpers.ts](../../../packages/core/src/postcss/helpers.ts) owns config-file selection and disk writes. [ast-generating.ts](../../../packages/core/src/postcss/ast-generating.ts) owns AST edits: plugin ordering, Vite registration, and Next body injection. Extend these owners when supporting another config shape; avoid adding separate rewrites in the installer.

## Boundaries that affect fixes

- Core setup uses `process.cwd()`. Installer subprocesses use the requested target directory, but the imported core initializer stays in the original process directory. For non-dot targets, inspect this handoff before assuming setup patches the installed app.
- Zero-UI must precede Tailwind. Vite setup removes the standalone Tailwind Vite integration because Zero-UI's wrapper supplies Tailwind through PostCSS.
- Next injection requires exactly one `layout.*` containing `<body>`. Zero or multiple matches produce a warning and skip injection; successful CLI completion does not prove every layout was patched.
- Config syntax outside recognized AST shapes can require manual plugin insertion. Preserve unrelated config and avoid duplicate imports/plugins/body spreads on repeated setup.

[AST generation tests](../../../packages/core/src/postcss/ast-generating.test.ts) and [helper tests](../../../packages/core/src/postcss/helpers.test.ts) cover patching. [Vite setup](../../../packages/core/__tests__/e2e/viteSetup.js) runs compiled core CLI code through [loadCli.js](../../../packages/core/__tests__/helpers/loadCli.js). Check [suite coverage](../build-test-ci.md) before relying on a test command's name.
