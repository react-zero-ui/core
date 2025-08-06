
<div align="center">

# 📚 API Reference

**Complete API documentation for React Zero-UI**

Detailed reference for all hooks, utilities, and configuration options.

</div>

---

## 📚 Table of Contents
- [🔨 Core Hooks](#-core-hooks)
- [🌈 Utilities](#-utilities)
- [🧪 Experimental APIs](#-experimental-apis)
- [🔧 TypeScript Types](#-typescript-types)
- [🚨 Limitations & Constraints](#-limitations--constraints)
- [📊 Generated Files](#-generated-files)
- [🔍 Debugging](#-debugging)

---

## 🔨 Core Hooks

### `useUI<T>(key, initial, flag?)`

Global UI state hook that updates `data-*` attributes on `<body>`.

```tsx
const [staleValue, setter] = useUI(key, initial, flag?);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | The state key (becomes `data-{key}` attribute) |
| `initial` | `T` | Initial/default value for SSR |
| `flag?` | `typeof CssVar` | Optional: Use CSS variables instead of data attributes |

#### Returns

| Return | Type | Description |
|--------|------|-------------|
| `staleValue` | `T` | Initial value (doesn't update, use for SSR only) |
| `setter` | `GlobalSetterFn<T>` | Function to update the global state |

#### Examples

```tsx
// Basic usage
const [theme, setTheme] = useUI('theme', 'light');
setTheme('dark'); // Sets data-theme="dark" on <body>

// With TypeScript generics
const [status, setStatus] = useUI<'loading' | 'success' | 'error'>('status', 'loading');

// With CSS variables
const [color, setColor] = useUI('primary', '#blue', CssVar);
setColor('#red'); // Sets --primary: #red on <body>

// Functional updates
setTheme(prev => prev === 'light' ? 'dark' : 'light');
```

---

### `useScopedUI<T>(key, initial, flag?)`

Scoped UI state hook that updates `data-*` attributes on a specific element.

```tsx
const [staleValue, setter] = useScopedUI(key, initial, flag?);
```

#### Parameters

Same as `useUI`, but affects only the element assigned to `setter.ref`.

#### Returns

| Return | Type | Description |
|--------|------|-------------|
| `staleValue` | `T` | Initial value (doesn't update, use for SSR only) |
| `setter` | `ScopedSetterFn<T>` | Function with attached `ref` property |

#### Examples

```tsx
// Basic scoped usage
const [modal, setModal] = useScopedUI('modal', 'closed');

<div 
	ref={setModal.ref}
	data-modal={modal} // Prevents FOUC
	className="modal-closed:hidden modal-open:block"
>
	Modal content
</div>

// With CSS variables
const [blur, setBlur] = useScopedUI('blur', '0px', CssVar);

<div 
	ref={setBlur.ref}
	style={{ '--blur': blur }}
	className="backdrop-blur-[var(--blur)]"
>
	Blurred content
</div>
```

---

## 🌈 Utilities

### `CssVar`

Flag to enable CSS variable mode instead of data attributes.

```tsx
import { CssVar } from '@react-zero-ui/core';

// Global CSS variable
const [color, setColor] = useUI('primary', '#blue', CssVar);
// Result: <body style="--primary: #blue">

// Scoped CSS variable
const [size, setSize] = useScopedUI('font-size', '16px', CssVar);
// Result: <div style="--font-size: 16px">
```

---

## 🧪 Experimental APIs

### `zeroSSR.onClick(key, values)`

Creates click handlers for server components (experimental).

```tsx
import { zeroSSR } from '@react-zero-ui/core/experimental';

const clickHandler = zeroSSR.onClick(key, values);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | State key (kebab-case required) |
| `values` | `string[]` | Array of values to cycle through |

#### Returns

Object with `data-ui` attribute for JSX spread.

#### Examples

```tsx
// Global state toggle
<button {...zeroSSR.onClick('theme', ['light', 'dark'])}>
	Toggle Theme
</button>

// Multi-value cycling
<button {...zeroSSR.onClick('status', ['idle', 'loading', 'success', 'error'])}>
	Cycle Status
</button>
```

---

### `scopedZeroSSR.onClick(key, values)`

Creates scoped click handlers for server components.

```tsx
import { scopedZeroSSR } from '@react-zero-ui/core/experimental';

const clickHandler = scopedZeroSSR.onClick(key, values);
```

#### Usage

Same as `zeroSSR.onClick`, but affects the closest ancestor with `data-{key}` attribute.

```tsx
<div data-modal="closed">
	<button {...scopedZeroSSR.onClick('modal', ['closed', 'open'])}>
		Open Modal
	</button>
	
	<div className="modal-closed:hidden modal-open:block">
		Modal content
	</div>
</div>
```

---

### `activateZeroUiRuntime(variantMap)`

Activates the SSR runtime for click handling (experimental).

```tsx
import { activateZeroUiRuntime } from '@react-zero-ui/core/experimental/runtime';
import { variantKeyMap } from './.zero-ui/attributes';

activateZeroUiRuntime(variantKeyMap);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `variantMap` | `Record<string, string[]>` | Generated variant mapping from build process |

#### Setup

```tsx
// src/components/InitZeroUI.tsx
'use client';

import { variantKeyMap } from '../.zero-ui/attributes';
import { activateZeroUiRuntime } from '@react-zero-ui/core/experimental/runtime';

activateZeroUiRuntime(variantKeyMap);

export const InitZeroUI = () => null;
```

```tsx
// app/layout.tsx
import { InitZeroUI } from '../components/InitZeroUI';

export default function RootLayout({ children }) {
	return (
		<html>
			<body>
				<InitZeroUI />
				{children}
			</body>
		</html>
	);
}
```

---

## 🔧 TypeScript Types

### `UIAction<T>`

Union type for state update actions.

```tsx
type UIAction<T extends string> = T | ((prev: T) => T);
```

### `GlobalSetterFn<T>`

Function type for global state setters.

```tsx
type GlobalSetterFn<T extends string> = (action: UIAction<T>) => void;
```

### `ScopedSetterFn<T>`

Function type for scoped state setters with attached ref.

```tsx
interface ScopedSetterFn<T extends string = string> {
	(action: UIAction<T>): void;
	ref?: RefObject<any> | ((node: HTMLElement | null) => void);
	cssVar?: typeof cssVar;
}
```

---

## 🚨 Limitations & Constraints

### State Key Requirements
- DO NOT USE IMPORTED VARIABLES IN THE STATE KEY
- Must be valid HTML attribute names
- Kebab-case required: `'sidebar-state'` not `'sidebarState'`
- Avoid conflicts with existing data attributes
- Must resolve to a non-spaced string: `'sidebar-state'` not `'sidebar State'`
- Must be a local constant that resolves to a string: 





### Scoped UI Constraints

- Each `useScopedUI` hook supports only one ref attachment
- Multiple refs will throw development-time errors
- Use separate hooks or components for multiple scoped elements

### CSS Variable Naming

- Automatically prefixed with `--`
- Must be valid CSS custom property names
- Example: `'primary-color'` becomes `'--primary-color'`

### SSR Considerations

- Initial values must be deterministic for SSR
- Avoid dynamic initial values that differ between server/client
- Use `useEffect` for client-only state initialization

---

## 📊 Generated Files

### `.zero-ui/attributes.ts`

Generated variant mapping for runtime activation.

```ts
/* AUTO-GENERATED - DO NOT EDIT */
export const bodyAttributes = {
  "data-theme": "light",
  "data-accent": "violet",
  "data-scrolled": "up",
  // ...
};

```

### `.zero-ui/styles.css` (Vite)

Generated CSS variants for Vite projects.

```css
/* Auto-generated Tailwind variants */
[data-theme="dark"] .theme-dark\:bg-gray-900 {
	background-color: rgb(17 24 39);
}
/* ... */
```

---

## 🔍 Debugging

### Enable Debug Mode

```js
// postcss.config.js
module.exports = {
	plugins: {
		'@react-zero-ui/core/postcss': {
			debug: true, // Enables verbose logging
		},
		tailwindcss: {},
	},
};
```

### Check Generated Output

```bash
# View generated variants
ls -la .zero-ui/
cat .zero-ui/attributes.ts
```

### Browser DevTools

1. **Elements tab:** Check for `data-*` attributes on target elements
2. **Computed styles:** Verify CSS rules are applying correctly
3. **Console:** Look for Zero-UI runtime messages (in debug mode)

---

## 🎯 Best Practices

### State Key Naming

```tsx
// ✅ Good: Descriptive and clear
useUI('theme', 'light')
useUI('sidebar-state', 'collapsed')
useUI('modal-visibility', 'hidden')

// ❌ Avoid: Generic or unclear
useUI('state', 'on')
useUI('x', 'y')
useUI('toggle', 'true')
```

### TypeScript Usage

```tsx
// ✅ Use specific union types
type Theme = 'light' | 'dark' | 'auto';
const [, setTheme] = useUI<Theme>('theme', 'light');

// ✅ For complex states, define types
type ModalState = 'closed' | 'opening' | 'open' | 'closing';
const [, setModal] = useUI<ModalState>('modal', 'closed');
```

### Performance Optimization

```tsx
// ✅ Use CSS for conditional rendering
<div className="modal-closed:hidden modal-open:block">
	Modal content
</div>

// ❌ Avoid reading stale values for logic
const [modal, setModal] = useUI('modal', 'closed');
{modal === 'open' && <Modal />} // Won't work as expected
```

---

<div align="center">

### 🎯 Need More Help?

[**📋 Usage Examples**](./usage-examples.md) | [**🔧 Troubleshooting**](./troubleshooting.md) | [**🔄 Migration Guide**](./migration-guide.md)

</div>