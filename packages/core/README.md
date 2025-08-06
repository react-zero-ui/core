# @react-zero-ui/core

![Tagline](https://img.shields.io/badge/The_ZERO_re--render_UI_state_library-%235500AD?style=flat&label=)
![Zero UI logo](https://raw.githubusercontent.com/react-zero-ui/core/upgrade/resolver/docs/assets/zero-ui-logo.png)

**The fastest possible UI updates in React. Period.**  
Zero runtime, zero React re-renders, and the simplest developer experience ever.  
_Say goodbye to context and prop-drilling._

[![Bundle size](https://badgen.net/bundlephobia/minzip/@react-zero-ui/core@0.2.6)](https://bundlephobia.com/package/@react-zero-ui/core@0.2.6)
[![npm version](https://img.shields.io/npm/v/@react-zero-ui/core)](https://www.npmjs.com/package/@react-zero-ui/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CI](https://github.com/react-zero-ui/core/actions/workflows/ci.yml/badge.svg?branch=main)

[📖 See the proof](https://github.com/react-zero-ui/core/blob/main/docs/assets/demo.md) • [🚀 Quick Start](#-quick-start) • [📚 API Reference](#-api-reference) • [🤝 Contributing](#-contributing)

---

## 🔥 Core Concept: _"Pre-Rendering"_

Why re-render UI if all states are known at build time?  
React Zero-UI **pre-renders** UI states once - at no runtime cost - and flips `data-*` attributes to update. That's it.

```tsx
const [, setTheme] = useUI('theme', 'dark');

// Flip theme to "light"
setTheme('light'); // data-theme="light" on body
```

Tailwind usage:

```html
<div class="theme-dark:bg-black theme-light:bg-white">Fast & Reactive</div>
```

---

## 🚀 How it Works (Build-Time Magic)

React Zero-UI uses a hyper-optimized AST resolver in development that scans your codebase for:

- `useUI` and `useScopedUI` hook usage
- Any variables resolving to strings (e.g., `'theme'`, `'modal-open'`)
- Tailwind variant classes (e.g., `theme-dark:bg-black`)

This generates:

- Optimal CSS with global or scoped variant selectors
- Initial `data-*` attributes injected onto `<body>` (zero FOUC)
- UI state with ease, no prop-drilling
- **Zero runtime overhead in production**

---

## 🚀 Quick Start

**Requires:** Vite or Next.js (App Router)

```bash
npx create-zero-ui
```

Manual config:

- [Next.js Setup](/docs/installation-next.md)
- [Vite Setup](/docs/installation-vite.md)

---

## 📚 API Reference

### Basic Hook Signature

```tsx
const [staleValue, setValue] = useUI('key', 'value');
```

- `key` ➡️ becomes `data-key` on `<body>`
- `value` ➡️ default SSR value
- `staleValue` ➡️ SSR fallback (doesn't update after mount)

---

### 🔨 `useUI` – Global UI State

```tsx
import { useUI } from '@react-zero-ui/core';

const [theme, setTheme] = useUI('theme', 'dark');
```

- Updates `data-theme` on `<body>`
- No React re-renders
- Globally accessible with Tailwind

---

### 🎯 `useScopedUI` – Scoped UI State

```tsx
import { useScopedUI } from '@react-zero-ui/core';

const [theme, setTheme] = useScopedUI('theme', 'dark');

<div
	ref={setTheme.ref}
	data-theme={theme}>
	Scoped UI Here
</div>;
```

- Sets `data-*` on a specific DOM node
- Scoped Tailwind variants only apply inside that element
- Prevents FOUC, no re-renders

---

### 🌈 CSS Variable Support

Pass the `CssVar` flag for variable-based state:

```tsx
import { CssVar } from '@react-zero-ui/core';

const [blur, setBlur] = useUI('blur', '0px', CssVar);
setBlur('5px'); // body { --blur: 5px }
```

Scoped example:

```tsx
const [blur, setBlur] = useScopedUI('blur', '0px', CssVar);

<div
	ref={setBlur.ref}
	style={{ '--blur': blur }}>
	Scoped blur effect
</div>;
```

---

## 🧪 Experimental Feature: `zeroOnClick`

Enables interactivity **inside Server Components** without useEffect.  
Only ~300 bytes of runtime.

Read more: [experimental.md](/docs/experimental.md)

---

## 📦 Summary of Benefits

- 🚀 **Zero React re-renders**
- ⚡️ **Pre-rendered UI**: state embedded at build time
- 📦 **<350B runtime footprint**
- 💫 **Simple DX**: hooks + Tailwind variants
- ⚙️ **AST-powered**: cached fast builds

Zero re-renders. Zero runtime. Infinite scalability.

---

## 🤝 Contributing

We welcome all contributions!

- 🐛 [Open an issue](https://github.com/react-zero-ui/core/issues)
- 💡 [Start a discussion](https://github.com/react-zero-ui/core/discussions)
- 🔧 [Read the contributing guide](/docs/CONTRIBUTING.md)

---

Made with ❤️ for the React community by [@austin1serb](https://github.com/austin1serb)
