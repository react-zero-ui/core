# 🔄 Migration Guide

<div align="center">

**Migrate to React Zero-UI from existing state management solutions**

Step-by-step guides for common migration scenarios.

</div>

---

## 🎯 From React useState

### Basic State Migration

**Before (React useState):**

```tsx
import { useState } from 'react';

function ThemeToggle() {
	const [theme, setTheme] = useState('light');

	return (
		<div className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
			<button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle Theme</button>
		</div>
	);
}
```

**After (React Zero-UI):**

```tsx
import { useUI } from '@react-zero-ui/core';

function ThemeToggle() {
	const [, setTheme] = useUI('theme', 'light');

	return (
		<div className="theme-light:bg-white theme-dark:bg-gray-900">
			<button onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>Toggle Theme</button>
		</div>
	);
}
```

**Key Changes:**

1. Replace `useState` with `useUI`
2. Replace conditional classNames with Tailwind variants
3. State key becomes a data attribute (`data-theme`)
4. Use functional updates for state transitions

### Modal State Migration

**Before:**

```tsx
function App() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<>
			<button onClick={() => setIsModalOpen(true)}>Open Modal</button>

			{isModalOpen && (
				<div className="fixed inset-0 bg-black/50">
					<div className="bg-white p-6">
						<button onClick={() => setIsModalOpen(false)}>Close</button>
					</div>
				</div>
			)}
		</>
	);
}
```

**After:**

```tsx
function App() {
	const [, setModal] = useUI('modal', 'closed');

	return (
		<>
			<button onClick={() => setModal('open')}>Open Modal</button>

			<div className="modal-closed:hidden fixed inset-0 bg-black/50">
				<div className="bg-white p-6">
					<button onClick={() => setModal('closed')}>Close</button>
				</div>
			</div>
		</>
	);
}
```

---

## ⚡️ From Context API

### Global Theme Context

**Before (Context API):**

```tsx
const ThemeContext = createContext();

function ThemeProvider({ children }) {
	const [theme, setTheme] = useState('light');

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			<div className={theme === 'dark' ? 'dark' : 'light'}>{children}</div>
		</ThemeContext.Provider>
	);
}

function ThemeToggle() {
	const { theme, setTheme } = useContext(ThemeContext);

	return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Current: {theme}</button>;
}
```

**After (React Zero-UI):**

```tsx
// No provider needed!

function App({ children }) {
	return <div className="theme-light:bg-white theme-dark:bg-gray-900">{children}</div>;
}

function ThemeToggle() {
	const [, setTheme] = useUI('theme', 'light');

	return (
		<button onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>
			<span className="theme-light:inline theme-dark:hidden">Light</span>
			<span className="theme-dark:inline theme-light:hidden">Dark</span>
		</button>
	);
}
```

**Benefits:**

- ❌ No more context providers
- ❌ No more prop drilling
- ❌ No re-renders when state changes
- ✅ State accessible anywhere via Tailwind classes

---

## 🏪 From Redux/Zustand

### Redux Theme Slice

**Before (Redux):**

```tsx
// store/themeSlice.ts
const themeSlice = createSlice({
	name: 'theme',
	initialState: { value: 'light' },
	reducers: {
		toggleTheme: (state) => {
			state.value = state.value === 'light' ? 'dark' : 'light';
		},
	},
});

// Component
function ThemeToggle() {
	const theme = useSelector((state) => state.theme.value);
	const dispatch = useDispatch();

	return (
		<div className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
			<button onClick={() => dispatch(toggleTheme())}>Toggle Theme</button>
		</div>
	);
}
```

**After (React Zero-UI):**

```tsx
// No store setup needed!

function ThemeToggle() {
	const [, setTheme] = useUI('theme', 'light');

	return (
		<div className="theme-light:bg-white theme-dark:bg-gray-900">
			<button onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>Toggle Theme</button>
		</div>
	);
}
```

### Zustand Store

**Before (Zustand):**

```tsx
const useThemeStore = create((set) => ({ theme: 'light', toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })) }));

function ThemeToggle() {
	const { theme, toggleTheme } = useThemeStore();

	return (
		<div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
			<button onClick={toggleTheme}>Current: {theme}</button>
		</div>
	);
}
```

**After (React Zero-UI):**

```tsx
function ThemeToggle() {
	const [, setTheme] = useUI('theme', 'light');

	return (
		<div className="theme-light:bg-white theme-dark:bg-gray-900">
			<button onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>
				<span className="theme-light:inline theme-dark:hidden">Light</span>
				<span className="theme-dark:inline theme-light:hidden">Dark</span>
			</button>
		</div>
	);
}
```

---

## 🎨 From CSS-in-JS Solutions

### Styled Components with Theme

**Before (Styled Components):**

```tsx
const ThemeProvider = styled.div`
	background: ${(props) => props.theme.bg};
	color: ${(props) => props.theme.text};
`;

const theme = { light: { bg: 'white', text: 'black' }, dark: { bg: 'black', text: 'white' } };

function App() {
	const [currentTheme, setCurrentTheme] = useState('light');

	return (
		<ThemeProvider theme={theme[currentTheme]}>
			<button onClick={() => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light')}>Toggle</button>
		</ThemeProvider>
	);
}
```

**After (React Zero-UI + Tailwind):**

```tsx
function App() {
	const [, setTheme] = useUI('theme', 'light');

	return (
		<div className="theme-light:bg-white theme-light:text-black theme-dark:bg-black theme-dark:text-white">
			<button onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>Toggle</button>
		</div>
	);
}
```

---

## 📱 From Component State to Global State

### Converting Local State to Global

**Before (Local component state):**

```tsx
function Sidebar() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className={`${isOpen ? 'w-64' : 'w-16'} transition-all`}>
			<button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
		</div>
	);
}

function Header() {
	// Can't access sidebar state! 😞
	return <div>Header content</div>;
}
```

**After (Global state, accessible everywhere):**

```tsx
function Sidebar() {
	const [, setSidebar] = useUI('sidebar', 'closed');

	return (
		<div className="sidebar-closed:w-16 sidebar-open:w-64 transition-all">
			<button onClick={() => setSidebar((prev) => (prev === 'closed' ? 'open' : 'closed'))}>Toggle</button>
		</div>
	);
}

function Header() {
	// Can respond to sidebar state! 🎉
	return <div className="sidebar-open:ml-64 sidebar-closed:ml-16 transition-all">Header content</div>;
}
```

---

## 🔧 Migration Checklist

### Step 1: Identify UI State

- [ ] List all `useState` hooks that control UI appearance
- [ ] Identify global state (Context, Redux, Zustand)
- [ ] Find conditional className logic
- [ ] Note prop drilling for UI state

### Step 2: Install and Configure

```bash
npx create-zero-ui
```

Or manual setup:

- [ ] Install `@react-zero-ui/core`
- [ ] Configure PostCSS plugin
- [ ] Update Tailwind config

### Step 3: Convert State by State

- [ ] Replace `useState` with `useUI`
- [ ] Convert conditional classes to Tailwind variants
- [ ] Remove context providers for UI state
- [ ] Update component dependencies

### Step 4: Test and Verify

- [ ] Verify all state changes work
- [ ] Check for any missing CSS variants
- [ ] Test SSR/hydration (no FOUC)
- [ ] Validate performance improvements

---

## 🚨 Migration Gotchas

### 1. State Key Naming

```tsx
// ❌ Avoid conflicts with existing data attributes
const [, setState] = useUI('id', 'default'); // conflicts with data-id

// ✅ Use descriptive, unique keys
const [, setState] = useUI('modal-state', 'closed');
```

### 2. Initial Value Consistency

```tsx
// ❌ Ensure initial values match what CSS expects
const [, setTheme] = useUI('theme', 'lite'); // typo!

// ✅ Match your Tailwind variants exactly
const [, setTheme] = useUI('theme', 'light'); // matches theme-light:
```

---

### 3. **No Imported State Keys (Yet)**

Imported variables can't be resolved statically — even if reassigned locally.

```ts
// ❌ This will fail at build time
import { THEME_KEY } from './constants';
const localKey = THEME_KEY;
const [, setTheme] = useUI(localKey, 'dark');
```

```ts
// ✅ Inline the string directly or re-declare as a top-level const
const THEME_KEY = 'theme';
const [, setTheme] = useUI(THEME_KEY, 'dark');
```

> 🧠 We're working on support for imported bindings once Next.js exposes a plugin API for Turbopack. Until then, stick with top-level `const` literals.

### 4. Don't Read Stale Values

```tsx
// ❌ Don't use returned value for logic
const [theme, setTheme] = useUI('theme', 'light');
if (theme === 'dark') {
	/* Won't work! */
}

// ✅ Use CSS classes for visual state
<div className="theme-dark:hidden">Only visible in light mode</div>;
```

---

## 📊 Before/After Comparison

| Aspect            | Before (Traditional)          | After (React Zero-UI)      |
| ----------------- | ----------------------------- | -------------------------- |
| **Bundle Size**   | +5KB (Redux) / +2KB (Context) | +350 bytes                 |
| **Re-renders**    | Every state change            | Zero                       |
| **Performance**   | Slower with scale             | Constant fast              |
| **Setup**         | Complex (store, providers)    | Simple (one hook)          |
| **Global Access** | Prop drilling / Context       | Tailwind variants anywhere |
| **SSR**           | Hydration mismatches          | Perfect SSR                |

---

<div align="center">

### 🎯 Migration Complete!

Your app should now be faster, simpler, and more maintainable.

[**🚀 Next: Usage Examples**](./usage-examples.md) | [**📖 API Reference**](../README.md#-api-reference)

</div>
