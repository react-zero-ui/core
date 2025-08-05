
## ⚡️ React Zero-UI 
*The ZERO re-render UI state library*

**The fastest possible UI updates in React. Period.**
Zero runtime, zero React re-renders, and the simplest developer experience ever.

See the proof in [here](/docs/demo)

<a href="https://bundlephobia.com/package/@react-zero-ui/core@0.2.6" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/bundlephobia/minzip/@react-zero-ui/core@0.2.6" alt="npm version" /> </a><a href="https://www.npmjs.com/package/@austinserb/react-zero-ui" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@react-zero-ui/core" alt="npm version" /></a> <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a> ![CI](https://github.com/react-zero-ui/core/actions/workflows/ci.yml/badge.svg?branch=main)

---


## 🔥 Core Concept: *"Pre-Rendering"*

Why re-render UI if all states are known at build time? React Zero-UI **pre-renders** UI states once, and flips `data-*` attribute to update - that's it.

**Example:**

```tsx
const [, setTheme] = useUI("theme", "dark");

// Flip theme to "light"
setTheme("light"); // data-theme="light" on body
```

Tailwind usage:

```html
<div class="theme-dark:bg-black theme-light:bg-white">Fast & Reactive</div>
```

---

## 🚀 How it Works (Build-Time Magic)

React Zero-UI uses a hyper-optimized AST resolver in development/build-time that scans your codebase for:

* `useUI` and `useScopedUI` hook usage.
* Any variables resolving to strings (e.g., `'theme'`, `'modal-open'`).
* Tailwind variant classes (e.g., `theme-dark:bg-black`).

This generates:

* Optimal CSS with scoped variant selectors.
* Initial data-attributes injected onto the body (zero FOUC).
* **Zero runtime overhead in production**.

---

## ⚙️ Installation (Zero-UI CLI)

pre-requisites:
- Tailwind CSS v4 must already be initialized in your project.
- Vite or Next.js (App Router)


```bash
npx create-zero-ui
```
> for manual configuration, see [manual installation.](https://github.com/react-zero-ui/core)

---

## 🔨 API: `useUI` Hook (Global UI state)

Simple hook mirroring React's `useState`:

```tsx
import { useUI } from '@react-zero-ui/core';

const [theme, setTheme] = useUI("theme", "dark");
```

* Flips global `data-theme` attribute on `<body>`.
* Zero React re-renders.
* Initial state pre-rendered at build time (no FOUC).

---

## 🎯 API: `useScopedUI` Hook (Scoped UI state)

Control UI states at the element-level:

```tsx
import { useScopedUI } from '@react-zero-ui/core';

const [theme, setTheme] = useScopedUI("theme", "dark");

// Flips data-theme attribute on the specific ref element
<div ref={setTheme.ref} data-theme={theme}>
  Scoped UI Here
</div>
```

* Data attribute flips on specific target element.
* Generates scoped CSS selectors only applying within the target element.

---

## 🌈 API: CSS Variables Support

Sometimes CSS variables are more efficient. React Zero-UI makes it trivial using the `CssVar` option:

```tsx
import { useUI, CssVar } from '@react-zero-ui/core';

const [blur, setBlur] = useUI("blur", "0px", CssVar);

// Flips CSS variable --blur on body
setBlur("5px"); // body { --blur: 5px }
```

**Scoped CSS Variable Example:**

```tsx
const [blur, setBlur] = useScopedUI("blur", "0px", CssVar);

<div ref={setBlur.ref} style={{ "--blur": blur }}>
  Scoped blur effect.
</div>
```

---

## 🧪 Experimental: SSR-safe `zeroOnClick`

Enable client-side interactivity **without leaving server components**.
Just 300 bytes of runtime overhead.

See [experimental](./docs/assets/experimental.md) for more details.

## 📦 Summary of Benefits

* **Zero React re-renders:** Pure CSS-driven UI state.
* **Pre-rendered UI:** All states injected at build-time. and only loaded when needed.
* **Tiny footprint:** <350 bytes runtime, zero overhead for CSS states.
* **SSR-safe interaction:** Static server components, fully interactive.
* **Amazing DX:** Simple hooks, auto-generated Tailwind variants.
* **Highly optimized AST resolver:** Fast, cached build process.

React Zero-UI delivers the fastest, simplest, most performant way to handle global and scoped UI state in modern React applications.


Made with ❤️  for the React community by [@austinserb](https://github.com/austin1serb)