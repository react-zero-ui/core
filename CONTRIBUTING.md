# Contributing to React Zero-UI

**Thanks for stopping by.** This project exists because builders like you push boundaries. If you're here to experiment, break things, or ship speed - you're in the right place.

---

## Core Philosophy

**React Zero-UI** is built on a radical idea:

> UI state should not require re-rendering.  
> CSS and `data-*` attributes can be enough.

It's fast because it **skips the VDOM entirely** - no state triggers, no diffing, no component redraws.

### If you contribute:

Stay **pre-rendered, declarative, and brutally fast.**

---

## Monorepo Structure

```
 packages/
├── core            -> @react-zero-ui/core (library logic + postcss)
└── cli             -> create-zero-ui (npx installer)
 docs/              -> Next.js + Fumadocs docs site (apps/docs replacement)
 examples/demo/     -> Live performance + sprite showcase app
```

For the variant extractor / PostCSS pipeline internals (AST parsing, literal resolution, token scanning), see [packages/core/ARCHITECTURE.md](packages/core/ARCHITECTURE.md).

---

## Local Setup

```bash
pnpm bootstrap    # builds + installs local tarball into test fixtures
pnpm test         # runs all tests (unit + E2E)
```

> Node 22+ and PNPM required.  
> Run from repo root.

---

## Project Context Files

- `.codex/project-summary.md` is the high-level overview of what this repo is and what it is for.
- `.codex/project-memory.md` is the working memory file for current repo state, recent decisions, and next steps. Helpful for LLM-based context bootstrapping.
- Keep `.codex/project-summary.md` durable and product-level.
- Keep `.codex/project-memory.md` short, tactical, and current.

---

## Contribution Flow

### 1. [Start a Discussion](https://github.com/react-zero-ui/core/discussions)

For questions, proposals, or early feedback. Share ideas before building.

### 2. [Open an Issue](https://github.com/react-zero-ui/core/issues)

Use the templates.

- **Bug** -> Include steps to reproduce, expected vs. actual behavior.
- **Feature** -> Explain the _why_, and sketch a possible approach.

### 3. Pull Requests

- Use semantic commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`
- Add tests if you touch logic, CLI, or rendering behavior.
- Keep PRs focused - one change per pull.
- Fill out the PR template - no empty descriptions.

---

## Test Commands

```bash
pnpm test:unit        # Core logic tests
pnpm test:integration # Core logic tests
pnpm test:cli         # CLI creation flow
pnpm test:vite        # E2E tests on Vite fixture
pnpm test:next        # E2E tests on Next.js fixture
pnpm test             # Runs all of the above
```

---

## Bundle Size

This repo measures bundle size from the built `@react-zero-ui/core` entry.

```bash
pnpm build
pnpm size          # prints the gzipped byte count
pnpm size:badge    # refreshes the README badge JSON
```

The `size` script runs:

```bash
npx esbuild ./packages/core/dist/index.js --bundle --minify --format=esm --external:react --define:process.env.NODE_ENV='"production"' | gzip -c | wc -c
```

`size:badge` writes [`.github/badges/core-size.json`](.github/badges/core-size.json), which the README badge reads through a Shields endpoint. Run it after a build when you want to refresh the number.

---

## Code of Conduct

Keep it respectful and accessible. Push ideas hard, not people.

---

## Contact

> Got a big idea? DM me:  
> [linkedin.com/in/austin-serb](https://www.linkedin.com/in/austin-serb/)
