/**
 * Returns [staleValue, setState] - destructure as `const [, setState] = useUI(...)`
 * The first value is intentionally stale/static, use only the setter.
 */
declare function useUI<T extends string | number | boolean | readonly string[]>(
	key: string,
	initialValue: T
): readonly [T, (v: T | ((currentValue: T) => T)) => void];

export { useUI };
export default useUI;
