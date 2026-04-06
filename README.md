<a align="end" href="https://zero-ui.dev">
	
![Tagline](https://img.shields.io/badge/The_ZERO_re--render_UI_state_library-%235500AD?style=flat&label=)

</a>

<p align="center" style="display:flex; align-items:center;">
 <img width="1000" height="144" alt="Frame 342" src="/docs/assets/zero-ui-logo.png" />
</p>

<div align="center">
 <strong>The fastest possible UI updates in React. Period.</strong>

Zero runtime, zero React re-renders, and a simple developer experience. <small>Say goodbye to context and prop-drilling.</small>

<a href="https://bundlephobia.com/package/@react-zero-ui/core@0.2.6" target="_blank" rel="noopener noreferrer"><img src="https://badgen.net/bundlephobia/minzip/@react-zero-ui/core@0.2.6" alt="bundle size" /></a> <a href="https://www.npmjs.com/package/@austinserb/react-zero-ui" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/npm/v/@react-zero-ui/core" alt="npm version" /></a> <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a> ![CI](https://github.com/react-zero-ui/core/actions/workflows/ci.yml/badge.svg?branch=main)

[See the proof](/docs/demo.md) [Quick Start](#quick-start) [API Reference](/docs/api-reference.md) [Usage Examples](/docs/usage-examples.md) [Migration Guide](/docs/migration-guide.md) [FAQ](/docs/faq.md) [Contributing](#contributing)

</div>

---

## Core Concept: _"Pre-Rendering"_

Why re-render UI if all states are known at build time? React Zero-UI pre-renders UI states at build time, then flips `data-*` attributes to update the interface.

**Example:**

```tsx
const [, setTheme] = useUI("theme", "dark");

// Flip theme to "light"
setTheme("light"); // data-theme="light" on body
```

**Tailwind usage:** <small>Anywhere in your app</small>

```html
<div class="theme-dark:bg-black theme-light:bg-white">Fast & Reactive</div>
```

---

## How it Works

React Zero-UI uses a hyper-optimized AST resolver in development that scans your codebase for:

- `useUI` and `useScopedUI` hook usage
- variables that resolve to strings like `'theme'` or `'modal-open'`
- Tailwind variant classes such as `theme-dark:bg-black`

**This generates:**

- optimal CSS with global or scoped variant selectors
- initial data attributes injected onto the body with no FOUC
- simple UI state without prop drilling
- zero runtime overhead in production

---

## Quick Start

<small>Zero-UI CLI</small>

**Prerequisites:**

- <small>Vite or Next.js (App Router)</small>
- <small>Tailwind v4 configured. See [Tailwind v4 Installation](https://tailwindcss.com/docs/installation/using-vite)</small>

```bash
npx create-zero-ui
```

> For manual configuration, see [Next.js Installation](/docs/installation-next.md) or [Vite Installation](/docs/installation-vite.md)

Start your app and use Zero-UI.

---

## API Reference

**Basic shape:**

```tsx
const [<staleValue>, <setterFunction>] = useUI(<stateKey>, <defaultValue>);
```

- `stateKey` becomes `data-{stateKey}` on `<body>`
- `defaultValue` supports SSR and helps prevent FOUC
- `staleValue` is used for scoped UI so you can set the `data-*` attribute to prevent FOUC
- the returned `staleValue` does not update; `useUI` is write-only

### `useUI` Hook (Global UI State)

Simple hook with the same shape as React's `useState`:

```tsx
import { useUI } from "@react-zero-ui/core";

const [theme, setTheme] = useUI("theme", "dark");
```

**Features:**

- flips a global `data-theme` attribute on `<body>`
- zero React re-renders
- global UI state available anywhere in your app through Tailwind variants

---

### `useScopedUI` Hook (Scoped UI State)

Control UI states at the element-level:

```diff
+ import { useScopedUI } from '@react-zero-ui/core';

const [theme, setTheme] = useScopedUI("theme", "dark");

// Flips data-* on the specific ref element
+ <div ref={setTheme.ref}
// Set the data-* to the staleValue to prevent FOUC
+ data-theme={theme}
>
  Scoped UI Here
</div>
```

**Features:**

- flips data attributes on a specific target element
- generates scoped CSS selectors that only apply within that element
- no FOUC and no re-renders

---

### CSS Variables Support

Sometimes CSS variables are more efficient. React Zero-UI supports them by passing the `CssVar` option:

```diff
+ Pass `CssVar` to either hook to use CSS variables

useUI(<cssVariable>, <defaultValue>, CssVar);

```

<small>Automatically adds `--` to the CSS variable.</small>

**Global CSS Variable:**

```diff
+ import { CssVar } from '@react-zero-ui/core';
```

```tsx
const [blur, setBlur] = useUI("blur", "0px", CssVar);
setBlur("5px"); // body { --blur: 5px }
```

**Scoped CSS Variable:**

```tsx
const [blur, setBlur] = useScopedUI("blur", "0px", CssVar);

<div
	ref={setBlur.ref}
	style={{ "--blur": blur }}>
	Scoped blur effect.
</div>;
```

---

## Experimental Features

### SSR-safe `zeroOnClick`

Enable client-side interactivity without leaving server components. About 300 bytes of runtime overhead.

See [experimental](./docs/experimental.md) for more details.

---

## Summary of Benefits

- zero React re-renders through pure CSS-driven UI state
- pre-rendered UI with states injected at build time
- tiny footprint with effectively no runtime overhead for CSS states
- simple hooks and auto-generated Tailwind variants
- a fast, cached AST resolver

React Zero-UI is a fast, simple way to handle global and scoped UI state in modern React apps without extra re-renders or prop drilling.

---

## Documentation

### Guides

| Guide                                          | Description                                            |
| ---------------------------------------------- | ------------------------------------------------------ |
| [API Reference](/docs/api-reference.md)        | Complete API documentation for all hooks and utilities |
| [Usage Examples](/docs/usage-examples.md)      | Practical patterns and real-world use cases            |
| [Migration Guide](/docs/migration-guide.md)    | Step-by-step migration from useState, Context, Redux   |
| [FAQ](/docs/faq.md)                            | Frequently asked questions and answers                 |
| [Experimental Features](/docs/experimental.md) | SSR-safe server component interactivity                |

### Setup

| Framework                                        | Guide                                   |
| ------------------------------------------------ | --------------------------------------- |
| [Next.js App Router](/docs/installation-next.md) | Complete Next.js setup with SSR support |
| [Vite + React](/docs/installation-vite.md)       | Vite configuration and optimization     |

### Examples

- [Live Demo](https://zero-ui.dev/) - Interactive playground
- [Performance Demo](https://zero-ui.dev/react) - 10k component benchmark
- [Demo Source Code](/examples/demo/) - Complete example project

---

## Contributing

We welcome bug fixes, feature requests, documentation improvements, and performance work from the community.

**Get involved:**

- Found a bug? [Open an issue](https://github.com/react-zero-ui/core/issues)
- Have an idea? [Start a discussion](https://github.com/react-zero-ui/core/discussions)
- Want to contribute code? Check out our [Contributing Guide](/docs/CONTRIBUTING.md)

> First-time contributor? Look for issues labeled `good-first-issue`.

<div align="center">
Made for the React community by <a href="https://github.com/austin1serb">@austin1serb</a><br />
Built with support from <a href="https://www.serbyte.net/">Serbyte Web Design &amp; Development</a>

</div>
