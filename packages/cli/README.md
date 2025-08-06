
# create-zero-ui

> ⚡ Instantly scaffold React Zero-UI into your Next.js or Vite project

```bash

npx create-zero-ui

```

---

## 🚀 What It Sets Up


### ✅ Shared (Next.js & Vite)

* Adds `@react-zero-ui/core` to your project
* Generates `.zero-ui/attributes.js` + `attributes.d.ts`
* Patches your `tsconfig.json`:

  ```json
  "paths": {
    "@zero-ui/attributes": ["./.zero-ui/attributes.js"]
  }
  ```

---

### 🔷 Next.js Specific

* Injects initial `data-*` attributes into `app/layout.tsx`
* Adds `postcss.config` with:

  ```js
  plugins: [
	// ❗zero-ui must come before tailwind
    "@react-zero-ui/core/postcss",
    "@tailwindcss/postcss"
  ]
  ```

---

### 🔶 Vite Specific

* Patches `vite.config.ts` with:

  ```ts
  export default defineConfig({
    plugins: [zeroUI(), react()]
  });
  ```
* Vite **does not require** a PostCSS config

---

## 🧪 Works With

* `Next.js` (App Router)
* `Vite` (React projects)
* `pnpm`, `yarn`, or `npm`

---

## 🛠 Usage

```bash
npx create-zero-ui
```

Follow the CLI prompts to scaffold your config in seconds.

---

## 📚 Related

* [@react-zero-ui/core](https://github.com/react-zero-ui/core)
* [Documentation](https://github.com/react-zero-ui/core/tree/main/docs)

---

## 🤝 Contributing

Found a bug or want to help?
PRs welcome at [react-zero-ui/core](https://github.com/react-zero-ui/core).

---

## License

MIT


---

### ✅ This README:
- Is **npm-ready** and GitHub-friendly.
- Makes **no assumptions** (Vite vs Next.js clearly separated).
- Avoids unnecessary branding/markup.
- Gives devs **trust** by showing exactly what gets modified.

Let me know if you want to auto-generate or publish it with a `postinstall` script that shows a success message with the same info.
```
