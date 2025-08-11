<a align="end" href="https://zero-ui.dev">
	
![Tagline](https://img.shields.io/badge/The_ZERO_re--render_UI_state_library-%235500AD?style=flat&label=)

</a>

<p align="center" style="display:flex; align-items:center;">
 <img width="1000" height="144" alt="Frame 342" src="/docs/assets/zero-ui-logo.png" />
</p>

<div align="center">
 <strong>The fastest possible UI updates in React. Period.</strong>

Zero runtime, zero React re-renders, and the simplest developer experience ever. <small>Say goodbye to context and prop-drilling.</small>

<a href="https://bundlephobia.com/package/@react-zero-ui/core@0.2.6" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/bundlephobia/minzip/@react-zero-ui/core@0.2.6" alt="bundle size" /></a> <a href="https://www.npmjs.com/package/@austinserb/react-zero-ui" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@react-zero-ui/core" alt="npm version" /></a> <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a> ![CI](https://github.com/react-zero-ui/core/actions/workflows/ci.yml/badge.svg?branch=main)

[📖 See the proof](/docs/demo.md) [🚀 Quick Start](#-quick-start) [📚 API Reference](/docs/api-reference.md) [📋 Usage Examples](/docs/usage-examples.md) [🔄 Migration Guide](/docs/migration-guide.md) [❓ FAQ](/docs/faq.md) [🤝 Contributing](#-contributing)

</div>

---

## 🔥 Core Concept: _"Pre-Rendering"_

Why re-render UI if all states are known at build time? React Zero-UI **pre-renders** UI states once ( at no runtime cost ), and flips `data-*` attributes to update - that's it.

**Example:**

```tsx
const [, setTheme] = useUI('theme', 'dark');

// Flip theme to "light"
setTheme('light'); // data-theme="light" on body
```

**Tailwind usage:** <small>Anywhere in your app</small>

```html
<div class="theme-dark:bg-black theme-light:bg-white">Fast & Reactive</div>
```

---

## 🚀 How it Works (Build-Time Magic)

React Zero-UI uses a hyper-optimized AST resolver in development that scans your codebase for:

- `useUI` and `useScopedUI` hook usage.
- Any variables resolving to strings (e.g., `'theme'`, `'modal-open'`).
- Tailwind variant classes (e.g. `theme-dark:bg-black`).

**This generates:**

- Optimal CSS with global or scoped variant selectors.
- Initial data-attributes injected onto the body (zero FOUC).
- UI state with ease, no prop-drilling.
- **Zero runtime overhead in production**.

---

## 🚀 Quick Start

<small>Zero-UI CLI</small>

**Pre-requisites:**

- <small>Vite or Next.js (App Router)</small>
- <small>Tailwind V4 Configured. See [Tailwind V4 Installation](https://tailwindcss.com/docs/installation/using-vite)</small>

```bash
npx create-zero-ui
```

> For manual configuration, see [Next JS Installation](/docs/installation-next.md) | [Vite Installation](/docs/installation-vite.md)

**That's it.** Start your app and see the magic.

---

## 📚 API Reference

**The Basics:**

```tsx
const [<staleValue>, <setterFunction>] = useUI(<stateKey>, <defaultValue>);
```

- `stateKey` ➡️ becomes `data-{stateKey}` on `<body>`.
- `defaultValue` ➡️ SSR, prevents FOUC.
- `staleValue` ➡️ For scoped UI, set the data-\* to the `staleValue` to prevent FOUC.
- **Note:** the returned `staleValue` does **not** update (`useUI` is write‑only).

### 🔨 `useUI` Hook (Global UI State)

Simple hook mirroring React's `useState`:

```tsx
import { useUI } from '@react-zero-ui/core';

const [theme, setTheme] = useUI('theme', 'dark');
```

**Features:**

- Flips global `data-theme` attribute on `<body>`.
- Zero React re-renders.
- Global UI state available anywhere in your app through tailwind variants.

---

### 🎯 `useScopedUI` Hook (Scoped UI State)

Control UI states at the element-level:

```diff
+ import { useScopedUI } from '@react-zero-ui/core';

const [theme, setTheme] = useScopedUI("theme", "dark");

// ❗️Flips data-* on the specific ref element
+ <div ref={setTheme.ref}
// ❗️set the data-* to the staleValue to prevent FOUC
+ data-theme={theme}
>
  Scoped UI Here
</div>
```

**Features:**

- Data-\* flips on specific target element.
- Generates scoped CSS selectors only applying within the target element.
- No FOUC, no re-renders.

---

### 🌈 CSS Variables Support

Sometimes CSS variables are more efficient. React Zero-UI makes it trivial by passing the `CssVar` option:

```diff
+ Pass `CssVar` to either hook to use CSS variables

useUI(<cssVariable>, <defaultValue>, CssVar);

```

<small>automatically adds `--` to the Css Variable</small>

**Global CSS Variable:**

```diff
+ import { CssVar } from '@react-zero-ui/core';
```

```tsx
const [blur, setBlur] = useUI('blur', '0px', CssVar);
setBlur('5px'); // body { --blur: 5px }
```

**Scoped CSS Variable:**

```tsx
const [blur, setBlur] = useScopedUI('blur', '0px', CssVar);

<div
	ref={setBlur.ref}
	style={{ '--blur': blur }}>
	Scoped blur effect.
</div>;
```

---

## 🧪 Experimental Features

### SSR-safe `zeroOnClick`

Enable client-side interactivity **without leaving server components**.
Just 300 bytes of runtime overhead.

See [experimental](./docs/experimental.md) for more details.

---

## 📦 Summary of Benefits

- **🚀 Zero React re-renders:** Pure CSS-driven UI state.
- **⚡️ Pre-rendered UI:** All states injected at build-time and only loaded when needed.
- **📦 Tiny footprint:** <350 bytes, zero runtime overhead for CSS states.
- **💫 Amazing DX:** Simple hooks, auto-generated Tailwind variants.
- **⚙️ Highly optimized AST resolver:** Fast, cached build process.

React Zero-UI delivers the fastest, simplest, most performant way to handle global and scoped UI state in modern React applications. Say goodbye to re-renders and prop-drilling.

---

---

## 📖 Documentation

### 📚 Complete Guide Collection

| Guide                                             | Description                                            |
| ------------------------------------------------- | ------------------------------------------------------ |
| [📚 API Reference](/docs/api-reference.md)        | Complete API documentation for all hooks and utilities |
| [📋 Usage Examples](/docs/usage-examples.md)      | Practical patterns and real-world use cases            |
| [🔄 Migration Guide](/docs/migration-guide.md)    | Step-by-step migration from useState, Context, Redux   |
| [🔧 Troubleshooting](/docs/troubleshooting.md)    | Common issues and debugging techniques                 |
| [❓ FAQ](/docs/faq.md)                            | Frequently asked questions and answers                 |
| [🧪 Experimental Features](/docs/experimental.md) | SSR-safe server component interactivity                |

### 🛠️ Setup Guides

| Framework                                        | Guide                                   |
| ------------------------------------------------ | --------------------------------------- |
| [Next.js App Router](/docs/installation-next.md) | Complete Next.js setup with SSR support |
| [Vite + React](/docs/installation-vite.md)       | Vite configuration and optimization     |

### 🎯 Learn by Example

- [🎮 **Live Demo**](https://zero-ui.dev/) - Interactive playground
- [📊 **Performance Demo**](https://zero-ui.dev/react) - 10k component benchmark
- [📁 **Demo Source Code**](/examples/demo/) - Complete example project

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, feature requests, documentation improvements, or performance optimizations - every contribution helps make React Zero-UI better.

**Get involved:**

- 🐛 Found a bug? [Open an issue](https://github.com/react-zero-ui/core/issues)
- 💡 Have an idea? [Start a discussion](https://github.com/react-zero-ui/core/discussions)
- 🔧 Want to contribute code? Check out our [**Contributing Guide**](/docs/CONTRIBUTING.md)

> **First time contributor?** We have good first issues labeled `good-first-issue` to help you get started!





<div align="center">
Made with ❤️ for the React community by <a href="https://github.com/austin1serb">@austin1serb</a>
</div>
