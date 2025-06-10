// Overload for boolean type
export function useUI<T extends boolean>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];

// Overload for string array types
export function useUI<T extends string[]>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];

// Overload for string types
export function useUI<T extends string>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];

// Overload for number types
export function useUI<T extends number>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];

// Overload for union types (most common use case)
export function useUI<T extends string>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];

// Generic fallback
export function useUI<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];
