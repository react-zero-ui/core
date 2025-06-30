import { Binding } from '@babel/traverse';
import * as t from '@babel/types';
export interface SetterMeta {
    /** Babel binding object — use `binding.referencePaths` in Pass 2 */
    binding: Binding;
    /** Variable name (`setTheme`) */
    setterName: string;
    /** State key passed to `useUI` (`'theme'`) */
    stateKey: string;
    /** Literal initial value as string, or `null` if non-literal */
    initialValue: string | null;
}
/**
 * Collects every `[ staleValue, setterFn ] = useUI('key', 'initial')` in a file.
 * @returns SetterMeta[]
 */
export declare function collectUseUISetters(ast: t.File): SetterMeta[];
export interface VariantData {
    key: string;
    values: string[];
    initialValue: string | null;
}
/**
 * Pass 2: Harvest all values from setter calls by examining their reference paths
 * @param setters - Array of SetterMeta from Pass 1
 * @returns Map of stateKey -> Set of discovered values
 */
export declare function harvestSetterValues(setters: SetterMeta[]): Map<string, Set<string>>;
/**
 * Convert the harvested variants map to the final output format
 */
export declare function normalizeVariants(variants: Map<string, Set<string>>, setters: SetterMeta[]): VariantData[];
/**
 * Main function: Extract all variant tokens from a JS/TS file
 * @param filePath - Path to the source file
 * @returns Array of variant data objects
 */
export declare function extractVariants(filePath: string): VariantData[];
/**
 * Extract variants from multiple files
 * @param filePaths - Array of file paths to analyze
 * @returns Combined and deduplicated variant data
 */
export declare function extractVariantsFromFiles(filePaths: string[]): VariantData[];
