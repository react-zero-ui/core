# Contributing to React Zero-UI

**Thanks for stopping by.** This project exists because builders like you push boundaries. If you're here to experiment, break things, or ship speed — you're in the right place.

---

## ⚡ Core Philosophy

**React Zero-UI** is built on a radical idea:

> UI state should not require re-rendering.  
> CSS and `data-*` attributes can be enough.

It's fast because it **skips the VDOM entirely** — no state triggers, no diffing, no component redraws.

### If you contribute:

Stay **pre-rendered, declarative, and brutally fast.**

---

## 🧠 Monorepo Structure

```
packages/
├── core     → @react-zero-ui/core (library logic + postcss)
└── cli      → create-zero-ui (npx installer)
```

---

## ⚙️ Local Setup

```bash
pnpm bootstrap    # builds + installs local tarball into test fixtures
pnpm test         # runs all tests (unit + E2E)
```

> Node 18+ and PNPM required.  
> Run from repo root.

---

## ✅ Contribution Flow

### 1. [Start a Discussion](https://github.com/react-zero-ui/core/discussions)

For questions, proposals, or early feedback. Share ideas before building.

### 2. [Open an Issue](https://github.com/react-zero-ui/core/issues)

Use the templates.

- **Bug** → Include steps to reproduce, expected vs. actual behavior.
- **Feature** → Explain the _why_, and sketch a possible approach.

### 3. Pull Requests

- Use semantic commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`
- Add tests if you touch logic, CLI, or rendering behavior.
- Keep PRs focused — one change per pull.
- Fill out the PR template — no empty descriptions.

---

## 🧪 Test Commands

```bash
pnpm test:unit        # Core logic tests
pnpm test:integration # Core logic tests
pnpm test:cli         # CLI creation flow
pnpm test:vite        # E2E tests on Vite fixture
pnpm test:next        # E2E tests on Next.js fixture
pnpm test             # Runs all of the above
```

---

## 🤝 Code of Conduct

Keep it respectful, accessible. Push ideas hard, not people.

---

## 📬 Contact

> Got a big idea? DM me:  
> [linkedin.com/in/austin-serb](https://www.linkedin.com/in/austin-serb/)
