# 🧪 Experimental Runtime (Zero-UI)

This folder contains the **SSR-safe runtime logic** for handling interactivity in React server components without using `use client`. It is designed to be tiny (\~300 bytes), deterministic, and fully compatible with React Zero-UI's pre-rendered data-attribute model.

---

## 📦 What This Code Does

### `activateZeroUiRuntime()`

This is the core runtime entrypoint. When called:

1. **Registers a single global click event listener** on `document`.

2. **Listens for clicks** on any element (or ancestor) with a `data-ui` attribute.

3. **Parses the `data-ui` directive** with this format:
   - `data-ui="global:key(val1,val2,...)"` ➡️ flips `data-key` on `document.body`
   - `data-ui="scoped:key(val1,val2,...)"` ➡️ flips `data-key` on closest matching ancestor or self

4. **Cycles the value** of the matching `data-*` attribute in a round-robin fashion.

5. **Updates the DOM instantly**, enabling Tailwind to respond via selectors (e.g. `theme-dark:bg-black`).

It guards against duplicate initialization using a `window.__zero` flag.

---

### `zeroSSR.onClick()` / `scopedZeroSSR.onClick()`

These utility functions generate valid `data-ui` attributes for use in JSX/TSX.

They return a prop like this:

```tsx
{ 'data-ui': 'global:theme(dark,light)' }
```

or

```tsx
{ 'data-ui': 'scoped:modal(open,closed)' }
```

**In development**, they also perform validation:

- Ensures the key is kebab-case.
- Ensures at least one value is provided.

---

## 🧠 Design Notes

- **No React state or re-renders** involved.
- Works entirely via DOM `data-*` mutations.
- Compatible with all server components.
- Fully tree-shakable and side-effect-free unless `activateZeroUiRuntime()` is called.

This design makes it ideal for pairing with Tailwind-style conditional classes in static components.

---

## 🧼 Summary

- `activateZeroUiRuntime()` ➡️ enables click handling on static components via `data-ui`
- `zeroSSR` / `scopedZeroSSR` ➡️ emit valid click handlers as JSX props
- No state. No runtime overhead. Works in server components.

This runtime is the bridge between **static HTML** and **interactive UX**, while keeping everything **server-rendered** and blazing fast.
