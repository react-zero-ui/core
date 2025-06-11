import { useCallback } from 'react';


export function useUI(key, initialValue) {

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
    const getCurrentValue = () => parseValue(document.body.dataset[key]);

    let newValue;
    if (typeof valueOrUpdater === 'function') {
      newValue = valueOrUpdater(getCurrentValue());
    } else {
      newValue = valueOrUpdater;
    }
    document.body.dataset[key] = String(newValue);
  }, [key]);


  // The actual current value lives in the DOM!
  return [initialValue, setValue];
}

