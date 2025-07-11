<!-- purpose: AI and codegen agents should use this to generate correct Zero-UI examples -->

# Guidelines for AI Agents in this Repo

This repository contains **React Zero-UI**, a library for global UI state without React re-renders.
Use these tips when working with the codebase or generating examples.

## How React Zero-UI works

1. `useUI()` writes to `document.body.dataset` using keys you specify.

```tsx
const [staleValue, setValue] = useUI<'open' | 'closed'>('sidebar', 'closed');
```

- `key` → becomes `data-{key}` on `<body>` (e.g., `sidebar` → `data-sidebar="closed"`).
- `defaultValue` → used for SSR to avoid FOUC. Added to the body as a data-attribute. at build time.
- The first value is **always stale** — do NOT rely on it for reactive updates.

2. Consumption is done strictly with tailwind variant classNames:

```html
<div className="sidebar-open:translate-x-0 sidebar-closed:-translate-x-full" />
```

3. Build-time tooling scans all `useUI()` keys and values, then generates matching Tailwind variants.

4. At runtime, calling the setter updates the `data-*` attribute on `<body>` immediately. No VDOM. No re-renders.

---

## Best Practices for AI Agents

- ✅ Use `useUI()` **only for UI state**: themes, layout flags, open/closed toggles, etc.
- ✅ Prefer **kebab-case keys**: e.g. `sidebar-open`, `theme-dark`.
- ✅ Always provide a `defaultValue`: prevents FOUC and enables SSR.
- ✅ Do **NOT** use the first value from `useUI()` for logic — it DOES NOT UPDATE.
- ✅ You can call setters **from anywhere** in the app — no prop drilling or context needed.
- ✅ Tailwind classes must use `key-value:` pattern:
  - `theme-dark:bg-black`
  - `accent-blue:text-blue-500`
  - `sidebar-open:translate-x-0`

---

## Example: Toggle Theme

```tsx
// Set state
const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
<button onClick={() => setTheme('dark')}>Switch to dark</button>;
```

```html
<!-- React component with Tailwind variant -->
<div className="theme-light:bg-white theme-dark:bg-black" />
```

## Example: Scoping Styles

```tsx
const [, setTheme] = useUI<'light' | 'dark'>('theme', 'light');
// Simply pass a ref to the element
<div
	ref={setTheme.ref}
	className="theme-light:bg-white theme-dark:bg-black"
/>;
```

Now the data-\* will flip on that element, and the styles will be scoped to that element, or its children.

---

## What NOT to do

- ❌ Do not pass anything to the StateKey or InitialValue that is not a string or does not resolve to a string.
- ❌ Don't use `useUI()` for business logic or data fetching
- ❌ Don't rely on the first tuple value for reactivity
- ❌ Don't use camelCase keys (will break variant generation)

---

## Summary

**React Zero-UI is a ZERO re-render UI state engine with global state baked in.** It replaces traditional VDOM cycles with `data-*` attribute flips and compile-time CSS. No React context. No prop drilling. No runtime cost.

Think of it as writing atomic Tailwind variants for every UI state — but flipping them dynamically at runtime without re-rendering anything.
