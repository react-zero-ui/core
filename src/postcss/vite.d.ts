import type { Plugin } from "vite";

export interface ZeroUIOptions {
	/** reserve for future options */
}

declare function zeroUI(options?: ZeroUIOptions): Plugin;

export default zeroUI;
