# 📚 Usage Examples & Patterns

<div align="center">

**Comprehensive examples and patterns for React Zero-UI**

Learn through practical, real-world use cases and best practices.

</div>

---

## 🎯 Basic Usage Patterns

### 1. Theme Toggle (Global State)

The most common pattern - global theme switching:

```tsx
import { useUI } from '@react-zero-ui/core';

function ThemeToggle() {
	const [theme, setTheme] = useUI('theme', 'light');

	return (
		<button
			onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
			className="theme-light:bg-white theme-dark:bg-gray-900 px-4 py-2 rounded">
			Current: {theme}
		</button>
	);
}
```

**Tailwind usage anywhere in your app:**

```html
<div className="theme-light:bg-white theme-dark:bg-gray-900">Content that responds to theme</div>
```

### 2. Modal State Management

```tsx
import { useUI } from '@react-zero-ui/core';

function App() {
	const [, setModal] = useUI('modal', 'closed');

	return (
		<>
			<button onClick={() => setModal('open')}>Open Modal</button>

			{/* Modal backdrop */}
			<div className="modal-closed:hidden modal-open:flex fixed inset-0 bg-black/50">
				<div className="modal-open:scale-100 modal-closed:scale-95 bg-white p-6 rounded-lg">
					<h2>Modal Content</h2>
					<button onClick={() => setModal('closed')}>Close</button>
				</div>
			</div>
		</>
	);
}
```

### 3. Multi-State Navigation

```tsx
import { useUI } from '@react-zero-ui/core';

type TabState = 'home' | 'about' | 'contact';

function Navigation() {
	const [activeTab, setActiveTab] = useUI<TabState>('nav-tab', 'home');

	const tabs = [
		{ id: 'home', label: 'Home' },
		{ id: 'about', label: 'About' },
		{ id: 'contact', label: 'Contact' },
	] as const;

	return (
		<nav className="flex gap-4">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					onClick={() => setActiveTab(tab.id)}
					className={`
						px-4 py-2 rounded transition-all
						nav-tab-${tab.id}:bg-blue-500 nav-tab-${tab.id}:text-white
						nav-tab-${tab.id}:scale-105
					`}>
					{tab.label}
				</button>
			))}
		</nav>
	);
}
```

---

## 🎯 Scoped UI Patterns

### 1. Component-Level State

```tsx
import { useScopedUI } from '@react-zero-ui/core';

function Card() {
	const [state, setState] = useScopedUI('card-state', 'collapsed');

	return (
		<div
			ref={setState.ref}
			data-card-state={state}
			className="card-state-collapsed:h-20 card-state-expanded:h-auto border rounded-lg">
			<button onClick={() => setState((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsed'))}>Toggle Card</button>

			<div className="card-state-collapsed:hidden p-4">
				<p>This content only shows when expanded!</p>
			</div>
		</div>
	);
}
```

### 2. Form Field States

```tsx
import { useScopedUI } from '@react-zero-ui/core';

function FormField({ label, ...props }) {
	const [state, setState] = useScopedUI('field-state', 'default');

	return (
		<div
			ref={setState.ref}
			data-field-state={state}
			className="field-state-error:border-red-500 field-state-success:border-green-500">
			<label>{label}</label>
			<input
				{...props}
				onFocus={() => setState('focused')}
				onBlur={() => setState('default')}
				onChange={(e) => {
					// Validate and set state accordingly
					const isValid = e.target.value.length > 0;
					setState(isValid ? 'success' : 'error');
				}}
			/>
			<div className="field-state-error:block field-state-default:hidden field-state-success:hidden text-red-500">This field is required</div>
		</div>
	);
}
```

---

## 🌈 CSS Variables Patterns

### 1. Dynamic Styling with CSS Variables

```tsx
import { useUI, CssVar } from '@react-zero-ui/core';

function DynamicTheme() {
	const [, setPrimaryColor] = useUI('primary-color', '#3b82f6', CssVar);
	const [, setBlur] = useUI('blur-amount', '0px', CssVar);

	const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

	return (
		<div>
			<div className="flex gap-2 mb-4">
				{colors.map((color) => (
					<button
						key={color}
						onClick={() => setPrimaryColor(color)}
						className="w-8 h-8 rounded"
						style={{ backgroundColor: color }}
					/>
				))}
			</div>

			<button onClick={() => setBlur('10px')}>Add Blur</button>

			{/* Uses CSS variables */}
			<div
				className="p-4 rounded-lg mt-4"
				style={{ backgroundColor: 'var(--primary-color)', filter: 'blur(var(--blur-amount))' }}>
				Dynamic styled content
			</div>
		</div>
	);
}
```

### 2. Scoped CSS Variables

```tsx
import { useScopedUI, CssVar } from '@react-zero-ui/core';

function CustomSlider() {
	const [value, setValue] = useScopedUI('slider-value', '50', CssVar);

	return (
		<div
			ref={setValue.ref}
			style={{ '--slider-value': value }}
			className="relative">
			<input
				type="range"
				min="0"
				max="100"
				onChange={(e) => setValue(e.target.value)}
				className="w-full"
			/>

			{/* Progress indicator using CSS variable */}
			<div
				className="absolute top-0 h-2 bg-blue-500 rounded"
				style={{ width: 'calc(var(--slider-value) * 1%)' }}
			/>
		</div>
	);
}
```

---

## 🚀 SSR-Safe Patterns (Experimental)

### 1. Server Component Interactivity

```tsx
// This is a SERVER COMPONENT! No 'use client' needed
import { zeroSSR } from '@react-zero-ui/core/experimental';

function ServerThemeToggle() {
	return (
		<button
			{...zeroSSR.onClick('theme', ['light', 'dark', 'auto'])}
			className="theme-light:bg-white theme-dark:bg-gray-900 px-4 py-2">
			<span className="theme-light:inline theme-dark:hidden theme-auto:hidden">Light Mode</span>
			<span className="theme-dark:inline theme-light:hidden theme-auto:hidden">Dark Mode</span>
			<span className="theme-auto:inline theme-light:hidden theme-dark:hidden">Auto Mode</span>
		</button>
	);
}
```

### 2. Scoped Server Component State

```tsx
import { scopedZeroSSR } from '@react-zero-ui/core/experimental';

function ServerModal() {
	return (
		// This data key will set the scope
		<div data-modal="closed">
			<button {...scopedZeroSSR.onClick('modal', ['closed', 'open'])}>Open Modal</button>

			<div className="modal-closed:hidden modal-open:block fixed inset-0 bg-black/50">
				<div className="bg-white p-6 rounded-lg">
					<h2>Server-Rendered Modal</h2>
					<button {...scopedZeroSSR.onClick('modal', ['open', 'closed'])}>Close</button>
				</div>
			</div>
		</div>
	);
}
```

---

## 💡 Advanced Patterns

### 1. State Composition

```tsx
import { useUI } from '@react-zero-ui/core';

function Dashboard() {
	const [, setSidebar] = useUI('sidebar', 'collapsed');
	const [, setTheme] = useUI('theme', 'light');
	const [, setNotifications] = useUI('notifications', 'hidden');

	return (
		<div
			className="
			sidebar-expanded:pl-64 sidebar-collapsed:pl-16
			theme-dark:bg-gray-900 theme-light:bg-white
			notifications-visible:pt-12
			transition-all duration-300
		">
			{/* Multiple states working together */}
		</div>
	);
}
```

### 2. Conditional Logic with Functional Updates

```tsx
import { useUI } from '@react-zero-ui/core';

function SmartToggle() {
	const [, setMode] = useUI('app-mode', 'normal');

	const handleModeChange = (condition: boolean) => {
		setMode((prev) => {
			if (condition && prev === 'normal') return 'advanced';
			if (!condition && prev === 'advanced') return 'normal';
			return prev; // No change
		});
	};

	return <button onClick={() => handleModeChange(true)}>Smart Toggle</button>;
}
```

### 3. Animation Sequences

```tsx
import { useUI } from '@react-zero-ui/core';

function AnimatedCard() {
	const [, setAnimation] = useUI('card-anim', 'idle');

	const playAnimation = async () => {
		setAnimation('preparing');
		await new Promise((resolve) => setTimeout(resolve, 100));

		setAnimation('animating');
		await new Promise((resolve) => setTimeout(resolve, 500));

		setAnimation('complete');
		await new Promise((resolve) => setTimeout(resolve, 200));

		setAnimation('idle');
	};

	return (
		<div
			className="
			card-anim-idle:scale-100 
			card-anim-preparing:scale-105 
			card-anim-animating:scale-110 card-anim-animating:rotate-12
			card-anim-complete:scale-100 card-anim-complete:bg-green-100
			transition-all duration-300
		">
			<button onClick={playAnimation}>Animate</button>
		</div>
	);
}
```

---

## 🎨 Styling Best Practices

### 1. Semantic State Names

```tsx
// ✅ Good: Semantic and clear
const [, setModal] = useUI('modal', 'closed');
const [, setTheme] = useUI('theme', 'light');
const [, setNavigation] = useUI('nav-state', 'collapsed');

// ❌ Avoid: Generic or unclear
const [, setState] = useUI('state', 'on');
const [, setThing] = useUI('x', 'y');
```

### 2. Consistent Naming Conventions

```tsx
// ✅ Use kebab-case for multi-word keys
const [, setSidebarState] = useUI('sidebar-state', 'collapsed');
const [, setUserProfile] = useUI('user-profile', 'hidden');

// ✅ Use clear value names
const [, setModal] = useUI('modal', 'closed'); // closed/open
const [, setTheme] = useUI('theme', 'light'); // light/dark/auto
```

### 3. Organize Complex States

```tsx
// ✅ For complex UIs, group related states
function App() {
	// Layout states
	const [, setSidebar] = useUI('sidebar', 'collapsed');
	const [, setHeader] = useUI('header', 'visible');

	// Theme states
	const [, setColorScheme] = useUI('color-scheme', 'light');
	const [, setAccentColor] = useUI('accent-color', 'blue');

	// UI states
	const [, setModal] = useUI('modal', 'closed');
	const [, setToast] = useUI('toast', 'hidden');
}
```

---

## 🚨 Common Pitfalls

### 1. ❌ Don't use Imported Variables in the state key/initial value

```tsx
// ❌ Wrong: Imported variables are not allowed
import { THEME_KEY } from './constants';
const [, setTheme] = useUI(THEME_KEY, 'dark');
```

### 1. ❌ Don't read state values for logic

```tsx
// ❌ Wrong: staleValue doesn't update
const [theme, setTheme] = useUI('theme', 'light');
if (theme === 'dark') {
	/* This won't work as expected */
}

// ✅ Correct: Use CSS classes instead
<div className="theme-dark:hidden theme-light:block">Light mode content</div>;
```

### 2. ❌ Avoid over-engineering simple toggles

```tsx
// ❌ Overcomplicated for simple boolean
const [, setState] = useUI('feature', 'disabled');
setState((prev) => (prev === 'disabled' ? 'enabled' : 'disabled'));

// ✅ Better: Use descriptive boolean-like values
const [, setFeature] = useUI('feature', 'off');
setState((prev) => (prev === 'off' ? 'on' : 'off'));
```

### 3. ❌ Don't attach multiple refs to scoped UI

```tsx
// ❌ Wrong: Multiple refs not supported
const [, setState] = useScopedUI('state', 'default');
return (
	<>
		<div ref={setState.ref} /> {/* First ref */}
		<div ref={setState.ref} /> {/* This will throw an error! */}
	</>
);

// ✅ Correct: Create separate components/hooks
function ComponentA() {
	const [, setState] = useScopedUI('state-a', 'default');
	return <div ref={setState.ref} />;
}

function ComponentB() {
	const [, setState] = useScopedUI('state-b', 'default');
	return <div ref={setState.ref} />;
}
```

---

<div align="center">

### 🎯 Ready to build?

These patterns cover 95% of real-world use cases. Mix and match them to create powerful, performant UIs.

[**🚀 View Live Demo**](https://zero-ui.dev) | [**📖 API Reference**](../README.md#-api-reference)

</div>
