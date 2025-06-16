import { useCallback } from 'react';

// Convert kebab-case to camelCase for dataset API
// "theme-secondary" -> "themeSecondary"
function kebabToCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

function useUI(key, initialValue) {

  const parseValue = (stringValue) => {
    if (stringValue === null || stringValue === undefined) return initialValue;

    if (typeof initialValue === 'boolean') {
      return stringValue === 'true';
    } else if (typeof initialValue === 'number') {
      return Number(stringValue);
    } else {
      return stringValue;
    }
  };

  const setValue = useCallback((valueOrUpdater) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const datasetKey = kebabToCamelCase(key);
    const getCurrentValue = () => parseValue(document.body.dataset[datasetKey]);

    let newValue;
    if (typeof valueOrUpdater === 'function') {
      newValue = valueOrUpdater(getCurrentValue());
    } else {
      newValue = valueOrUpdater;
    }
    document.body.dataset[datasetKey] = String(newValue);
  }, [key]);


  // The actual current value lives in the DOM!
  return [initialValue, setValue];
}



export { useUI };
export default useUI;