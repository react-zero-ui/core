import { PluginCreator } from "postcss";

interface ReactZeroUIOptions {
	dirs?: string[];
	cwd?: string;
	watch?: boolean;
}

declare const plugin: PluginCreator<ReactZeroUIOptions>;
export = plugin;
