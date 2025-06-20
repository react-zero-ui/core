import { useCallback } from 'react';

function useUI(key, initialValue) {
	//setValue(valueOrUpdater)
	const setValue = useCallback(
		valueOrUpdater => {
			if (typeof window === 'undefined') return;
			// Convert kebab-case to camelCase for dataset API
			// "theme-secondary" -> "themeSecondary"
			const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
			let newValue;
			if (typeof valueOrUpdater === 'function') {
				const parse = v => {
					if (!v) return initialValue;
					switch (typeof initialValue) {
						case 'boolean':
							return v === 'true';
						case 'number': {
							const n = Number(v);
							return isNaN(n) ? initialValue : n;
						}
						default:
							return v;
					}
				};
				newValue = valueOrUpdater(parse(document.body.dataset[camelKey]));
			} else {
				newValue = valueOrUpdater;
			}
			document.body.dataset[camelKey] = String(newValue);
		},
		[key]
	);
	return [initialValue, setValue];
}

export { useUI };
export default useUI;
