import type { Plugin } from 'vite';

export interface ZeroUIOptions {
	/** reserved for future options */
}

declare function zeroUI(options?: ZeroUIOptions): Plugin;

export default zeroUI;
