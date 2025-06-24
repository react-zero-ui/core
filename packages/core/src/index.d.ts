/**
 * Returns [staleValue, setState] - destructure as `const [, setState] = useUI(...)`
 * The first value is intentionally stale/static, use only the setter.
 */
declare function useUI<T extends string | number | boolean | readonly string[]>(
	key: string,
	initialValue: T
): readonly [T, (v: T | ((currentValue: T) => T), options?: { scope?: HTMLElement }) => void];

export { useUI };
export default useUI;

// TODO ADD SOMETHING SIMILAR FOR TYPESCRIPT AUTOCOMPLETE IN VSCODE:
// export function useUI<K extends keyof UIMap>(
//   key: K,
//   initial: UIMap[K]
// ): [
//   UIMap[K],
//   (
//     update: UIMap[K] | ((prev: UIMap[K]) => UIMap[K]),
//     target?: HTMLElement | Event
//   ) => void
// ];
