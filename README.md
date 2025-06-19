# React Zero-UI (Beta)

**Instant UI state updates. ZERO React re-renders. ZERO runtime overhead.** Update the UI instantly, manage global UI state from anywhere. No prop drilling. get started with one command in your existing React app. `npx create-zero-ui`

[![npm version](https://img.shields.io/npm/v/@austinserb/react-zero-ui)](https://www.npmjs.com/package/@austinserb/react-zero-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CI](https://github.com/austin1serb/react-zero-ui/actions/workflows/ci.yml/badge.svg?branch=main)

## Why Zero-UI?

Traditional React state triggers RE-renders for every UI change. Switching themes? That's every component RE-rendering. Opening a menu? Same story.

**Enter "PRE-rendering"**
Zero-UI bypasses React entirely for pure UI state. Instead of re-renders, it:

- Pre-renders CSS styles and keeps them in the DOM
- For state changes it flips a `data-*` attribute key.
- Thats it.

**Result:** UI updates that are 10-50x faster.

### Performance Comparison

Apple M1

| Nodes  | React State | Zero-UI | Improvement |
| ------ | ----------- | ------- | ----------- |
| 1,000  | ~50ms       | ~5ms    | 10x faster  |
| 5,000  | ~180ms      | ~15ms   | 12x faster  |
| 10,000 | ~400ms      | ~20ms   | 20x faster  |

## Quick Start

**Prerequisites:** Tailwind v4 must be initialized

CLI script - in your existing Next or Vite App's root:

```bash
npx create-zero-ui
```

## Manual Installation

```bash
npm install @austinserb/react-zero-ui
```

### Setup

**Prerequisites:** Tailwind v4 must be initialized. [tailwind set up ]("tailwind.com")

#### Vite

```js
// vite.config.*
import { zeroUIPlugin } from '@austinserb/react-zero-ui/vite';

export default {
	//*REMOVE TAILWIND PLUGIN* Zero-UI extends tailwinds plug-in
	plugins: [zeroUIPlugin()],
};
```

#### Next.js

#### 1. Spread bodyAttributes on `<body>` in Layout

```jsx
import { bodyAttributes } from '@zero-ui/attributes';
//or
import { bodyAttributes } from '../.zero-ui/attributes';

export default function RootLayout({ children }) {
	return (
		<html>
			<body {...bodyAttributes}>{children}</body>
		</html>
	);
}
```

#### 2. Add PostCSS Plugin

```js
// postcss.config.js
module.exports = {
  plugins: {
    ['@austinserb/react-zero-ui/postcss']
    //*tailwindcss MUST come AFTER Zero-UI
    ['@tailwindcss']
  }
}
```

## Usage

**Basic Theme Switching**

```tsx
import { useUI } from '@austinserb/react-zero-ui';

function ThemeToggle() {
  const [, setTheme] = useUI<"light | dark">('theme', 'light');

    <button onClick={() => setTheme('dark')}>
      Switch Theme
    </button>
```

**Consume the state in any component with tailwind!**

```jsx
className = 'theme-light:bg-white theme-dark:bg-black';
```

**Mutate the state in any component!**

```jsx

function UnrelatedPage()
  const [, setTheme] = useUI('theme', 'light');

    <button onClick={setTheme("dark")}>
    </button>
```

**Use with complex Tailwind Variants**

```jsx
clasName = 'md:theme-dark:bg-black md:peer-checked:theme-light:hidden';
```

## How It Works

1. **State Store**: The `useUI` hook writes to `data-*` attributes on the `<body>` tag instead of React state

   ```html
   <body
   	data-theme="dark"
   	data-accent="blue"
   	data-sidebar="open"></body>
   ```

2. **Babel Transform**: Automatically detects all `useUI` variants in your code during build

3. **PostCSS Plugin**: Generates Tailwind variant classes for every detected state

   ```css
   .theme-dark\:bg-gray-900 {
   	background-color: rgb(17 24 39);
   }
   ```

4. **Instant Updates**: When you call a setter, only the data attribute changes. The browser doesn't have to create a VDOM, and compare it to the current HTML tree (Diffing), and then determine if an update is needed (Reconciliation), and then apply that update (Re-render) by injecting into the html tree. Then the browser has to compile the new injected Html and Css, then compute style, THEN paint the pixels.

## API

### `useUI(key: string, SSRValue: string)`

Returns a tuple similar to `useState`, but the first value is intentionally stale.

```jsx
const [staleValue, setValue] = useUI('theme', 'light');
```

- `key`: The UI state key (becomes `data-{key}` on body)
- `defaultValue`: Initial value if not set
- Returns: `[staleValue, setValue]`

**note:** normaly used as const `const [,setValue]=useUI()` to denote that the value is stale and will not update

### Tailwind Variants

Use the pattern `{key}-{value}:` as a Tailwind variant:

```jsx
<div className="theme-light:bg-white theme-dark:bg-black" />
<div className="accent-red:text-red-500 accent-blue:text-blue-500" />
<div className="sidebar-open:translate-x-0 sidebar-closed:-translate-x-full" />
```

## Features

- ✅ **Zero React re-renders** for UI state changes
- ✅ **No Context providers** needed
- ✅ **Works globally** - call setters from anywhere
- ✅ **TypeScript support** out of the box
- ✅ **SSR compatible** with Next.js
- ✅ **Tiny bundle size** (954bytes)
- ✅ **Framework agnostic CSS** - the generated CSS works everywhere

## Best Practices

1. **Use for UI-only state**: Themes, sidebar states, UI flags
2. **Not for business logic**: Keep using React state for data that affects logic
3. **Consistent naming**: Prefer kebab-case for keys (`sidebar-state`, not `sidebarState`)
4. **Default values**: Always provide default value for  
   `useUI('key', 'value')` to avoid FOUC.

## Contributing

We love contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © Austin Serb

---

Built with ❤️ for the React community. If Zero-UI helps your app feel snappier, consider [starring the repo](https://github.com/austinserb/zero-ui)!
