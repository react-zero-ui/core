<div align="center">
<h1> 🧪 Experimental Runtime (Zero-UI) </h1>

**SSR-safe runtime logic** for handling interactivity in React server components without using

```diff
- use client
```

</div>
<div align="center">
Designed to be tiny(~300 bytes), deterministic, and fully compatible with 
	
React Zero-UI's pre-rendered data-attribute model.

</div>

---

### ❓ Why This Approach?

**The Problem:** A single `onClick` event forces your entire component tree to become client-rendered. In Next.js, this means shipping extra JavaScript, losing SSR benefits, and adding hydration overhead-all for basic interactivity.

**The Solution:** This design creates the perfect bridge between **static HTML** and **interactive UX**, while maintaining:

- Server-rendered performance
- Zero JavaScript bundle overhead
- Instant visual feedback

_Why sacrifice server-side rendering for a simple click handler when 300 bytes of runtime can handle all the clicks in your app?_

---

## 📦 Core Functionality

### `activateZeroUiRuntime()`

The core runtime entrypoint that enables client-side interactivity in server components:

**How it works:**

1. **🎯 Single Global Listener** - Registers one click event listener on `document`
2. **👂 Smart Detection** - Listens for clicks on elements with `data-ui` attributes
3. **🔍 Directive Parsing** - Interprets `data-ui` directives in this format.

```diff
+ 	data-ui="global:key(val1,val2,...)"   ➡️ flips data-key on document.body
+ 	data-ui="scoped:key(val1,val2,...)"   ➡️ flips data-key on closest ancestor/self
```

4. **🔄 Round-Robin Cycling** - Cycles through values in sequence
5. **⚡️ Instant DOM Updates** - Updates DOM immediately for Tailwind responsiveness

> **Note:** Guards against duplicate initialization using `window.__zero` flag.

---

## 🛠️ Helper Functions

### `zeroSSR.onClick()` & `scopedZeroSSR.onClick()`

Utility functions that generate valid `data-ui` attributes for JSX/TSX:

**Global Example:**

```tsx
zeroSSR.onClick('theme', ['dark', 'light']);
// Returns: { 'data-ui': 'global:theme(dark,light)' }
```

**Scoped Example:**

```tsx
scopedZeroSSR.onClick('modal', ['open', 'closed']);
// Returns: { 'data-ui': 'scoped:modal(open,closed)' }
```

**Development Validation:**

- ✅ Ensures keys are kebab-case
- ✅ Validates at least one value is provided

---

## 🚀 Installation & Setup

### Step 1: Install Package

```bash
npm install @react-zero-ui/core@0.3.1-beta.2
```

### Step 2: Generate Variants

Run your development server to generate the required variant map:

```bash
npm run dev
```

This creates `.zero-ui/attributes.ts` containing the variant map needed for runtime activation.

### Step 3: Create `<InitZeroUI>` Component

```tsx
'use client';

import { variantKeyMap } from 'path/to/.zero-ui/attributes';
import { activateZeroUiRuntime } from '@react-zero-ui/core/experimental/runtime';

activateZeroUiRuntime(variantKeyMap);

export const InitZeroUI = () => null;
```

### Step 4: Add to Root Layout

```tsx
import { InitZeroUI } from 'path/to/InitZeroUI';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<InitZeroUI />
				{children}
			</body>
		</html>
	);
}
```

---

## 💡 Usage Examples

### Global Theme Toggle

```tsx
import { zeroSSR } from '@react-zero-ui/core/experimental';

<div {...zeroSSR.onClick('theme', ['dark', 'light', 'spanish'])}>Click me to cycle themes!</div>;
```

**Pair with Tailwind variants:**

```html
<div class="theme-dark:bg-black theme-light:bg-white theme-spanish:bg-red-500">Interactive Server Component!</div>
```

### Scoped Modal Toggle

```tsx
import { scopedZeroSSR } from '@react-zero-ui/experimental';

// ❗️ Scopes based on matching data-* attribute (e.g. data-modal)
<div data-modal="open">
	<button {...scopedZeroSSR.onClick('modal', ['open', 'closed'])}>Toggle Modal</button>
</div>;
```

---

## 🧠 Design Philosophy

### Core Principles

- **🚫 No React State** - Zero re-renders involved
- **🎯 Pure DOM Mutations** - Works entirely via `data-*` attribute changes
- **🔧 Server Component Compatible** - Full compatibility with all server components
- **⚡️ Tailwind-First** - Designed for conditional CSS classes

---

## 📋 Summary

| Feature                         | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| **`activateZeroUiRuntime()`**   | Enables click handling on static components via `data-ui` |
| **`zeroSSR` / `scopedZeroSSR`** | Generate valid click handlers as JSX props                |
| **Runtime Overhead**            | ~300 bytes total                                          |
| **React Re-renders**            | Zero                                                      |
| **Server Component Support**    | ✅ Full compatibility                                     |

> **Source Code:** See [experimental](/packages/core/src/experimental) for implementation details.

---

<div align="center">

**The bridge between static HTML and interactive UX**

_No state. No runtime overhead. Works in server components. ZERO re-renders._

[**🚀 Get Started in less than 5 minutes**](/#-quick-start)

</div>
