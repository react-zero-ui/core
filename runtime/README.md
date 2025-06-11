# React Zero UI

React Zero UI is a pre-rendering UI state management library for React apps. It allows you to manage UI state without re-rendering your components.

It's powered by Tailwind v4 and PostCSS.

It's designed to be a zero-config solution for UI state management.

## Note

This is a work in progress. It's not fully ready for production.

## Install
```
npm install @austinserb/react-zero-ui
```

## Usage
```jsx
import { useUI } from '@austinserb/react-zero-ui';
const [theme, setTheme] = useUI('theme', 'light');

//Then use it in your your components with tailwind
<button onClick={() => setTheme('dark')}>
  <div className="theme-light:bg-gray-100 theme-dark:bg-gray-900">
    Toggle Theme
  </div>
</button>

```
