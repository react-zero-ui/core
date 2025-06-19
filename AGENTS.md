# Guidelines for AI Agents in this Repo

This repository contains **React Zero-UI**, a library for global UI state without React re-renders.
Use these tips when working with the codebase or generating examples.

## How React Zero-UI works

1. `useUI()` writes to `document.body.dataset` using keys you specify (e.g. `theme` → `data-theme`).
2. Build tooling scans for all keys and values, generating CSS variants for each.
3. When a setter is called, the corresponding body attribute changes instantly with no React re-render.

## Best practices

- Only use `useUI` for UI-only state (themes, flags, etc.).
- Prefer kebab-case keys (`sidebar-open`) so generated variants are predictable.
- Always pass a default value to `useUI(key, defaultValue)` to avoid flashes during SSR.
- Mutate the state anywhere in the app: `const [, setTheme] = useUI('theme', 'light');` then call `setTheme('dark')`.
- Compose Tailwind classes anywhere with the pattern `key-value:` like `theme-dark:bg-black`.
