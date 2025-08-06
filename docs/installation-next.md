### Next.js (App Router) Setup

1. **Install the dependencies**

```bash
npm install @react-zero-ui/core
```

```bash
npm install @tailwindcss/postcss
```

---

2. **Add the PostCSS plugin (must come _before_ Tailwind).**

```js
// postcss.config.* ESM Syntax
const config = {
	// ❗️ Zero-UI must come before Tailwind
	plugins: ['@react-zero-ui/core/postcss', '@tailwindcss/postcss'],
};
export default config;
```

```js
// postcss.config.* Common Module Syntax
module.exports = {
	// ❗️ Zero-UI must come before Tailwind
	plugins: { '@react-zero-ui/core/postcss': {}, tailwindcss: {} },
};
```

---

3. **Start the App**

```bash
npm run dev
```

> Zero-UI will generate a .zero-ui folder in your project root. and generate the attributes.ts and type definitions for it.

---

4. **Preventing FOUC (Flash Of Unstyled Content)**

Spread `bodyAttributes` on `<body>` in your root layout.

```tsx
// app/layout.tsx
import { bodyAttributes } from './.zero-ui/attributes';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			// ❗️ Spread the bodyAttributes on the body tag
			<body {...bodyAttributes}>{children}</body>
		</html>
	);
}
```

**Thats it.**
Zero-UI will now add used data-\* attributes to the body tag and the CSS will be injected and transformed by tailwind.

** 🧪 Checkout our Experimental SSR Safe OnClick Handler **

[**🚀 Zero UI OnClick**](/docs/experimental.md)
