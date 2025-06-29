"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectUseUISetters = collectUseUISetters;
exports.harvestSetterValues = harvestSetterValues;
exports.normalizeVariants = normalizeVariants;
exports.extractVariants = extractVariants;
exports.extractVariantsFromFiles = extractVariantsFromFiles;
const parser_1 = require("@babel/parser");
const babelTraverse = __importStar(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const config_cjs_1 = require("../../config.cjs");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const traverse = babelTraverse.default;
/**
 * Collects every `[ , setter ] = useUI('key', 'initial')` in a file.
 * @returns SetterMeta[]
 */
function collectUseUISetters(ast) {
    const setters = [];
    traverse(ast, {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            // Match: const [ , setX ] = useUI(...)
            if (t.isArrayPattern(id) && id.elements.length === 2 && t.isCallExpression(init) && t.isIdentifier(init.callee, { name: config_cjs_1.CONFIG.HOOK_NAME })) {
                const [, setterEl] = id.elements;
                if (!t.isIdentifier(setterEl))
                    return; // hole or non-identifier
                // Validate & grab hook args
                const [keyArg, initialArg] = init.arguments;
                if (!t.isStringLiteral(keyArg))
                    return; // dynamic keys are ignored
                setters.push({
                    binding: path.scope.getBinding(setterEl.name), // never null here
                    setterName: setterEl.name,
                    stateKey: keyArg.value,
                    initialValue: literalToString(initialArg),
                });
            }
        },
    });
    return setters;
}
/**
 * Pass 2: Harvest all values from setter calls by examining their reference paths
 * @param setters - Array of SetterMeta from Pass 1
 * @returns Map of stateKey -> Set of discovered values
 */
function harvestSetterValues(setters) {
    const variants = new Map();
    // Initialize with initial values from Pass 1
    for (const setter of setters) {
        if (!variants.has(setter.stateKey)) {
            variants.set(setter.stateKey, new Set());
        }
        if (setter.initialValue) {
            variants.get(setter.stateKey).add(setter.initialValue);
        }
    }
    // Examine each setter's reference paths
    for (const setter of setters) {
        const valueSet = variants.get(setter.stateKey);
        // Boolean optimization: if initial value is 'true' or 'false',
        // we know all possible values without traversing
        if (setter.initialValue === 'true' || setter.initialValue === 'false') {
            valueSet.add('true');
            valueSet.add('false');
            continue; // Skip traversal for this setter
        }
        // Look at every place this setter is referenced
        for (const referencePath of setter.binding.referencePaths) {
            // Check if this reference is being called as a function
            const callPath = findCallExpression(referencePath);
            if (callPath) {
                // Extract values from the first argument of the call
                const firstArg = callPath.node.arguments[0];
                if (firstArg) {
                    const extractedValues = extractLiteralsRecursively(firstArg, callPath);
                    extractedValues.forEach((value) => valueSet.add(value));
                }
            }
        }
    }
    return variants;
}
/**
 * Check if a reference path is part of a function call
 * Handles: setTheme('dark'), obj.setTheme('dark'), etc.
 */
function findCallExpression(referencePath) {
    const parent = referencePath.parent;
    // Direct call: setTheme('dark')
    if (t.isCallExpression(parent) && parent.callee === referencePath.node) {
        return referencePath.parentPath;
    }
    // Member expression call: obj.setTheme('dark')
    if (t.isMemberExpression(parent) && parent.property === referencePath.node) {
        const grandParent = referencePath.parentPath?.parent;
        if (t.isCallExpression(grandParent) && grandParent.callee === parent) {
            return referencePath.parentPath?.parentPath;
        }
    }
    return null;
}
/**
 * Recursively extract literal values from an expression
 * Handles: literals, ternaries, logical expressions, functions, identifiers
 */
function extractLiteralsRecursively(node, path) {
    const results = [];
    // Base case: direct literals
    const literal = literalToString(node);
    if (literal !== null) {
        results.push(literal);
        return results;
    }
    // Ternary: condition ? 'value1' : 'value2'
    if (t.isConditionalExpression(node)) {
        results.push(...extractLiteralsRecursively(node.consequent, path));
        results.push(...extractLiteralsRecursively(node.alternate, path));
    }
    // Logical expressions: a && 'value' || 'default'
    else if (t.isLogicalExpression(node)) {
        results.push(...extractLiteralsRecursively(node.left, path));
        results.push(...extractLiteralsRecursively(node.right, path));
    }
    // Arrow functions: () => 'value' or prev => prev==='a' ? 'b':'a'
    else if (t.isArrowFunctionExpression(node)) {
        if (t.isExpression(node.body)) {
            results.push(...extractLiteralsRecursively(node.body, path));
        }
        else if (t.isBlockStatement(node.body)) {
            // Look for return statements
            results.push(...extractFromBlockStatement(node.body, path));
        }
    }
    // Function expressions: function() { return 'value'; }
    else if (t.isFunctionExpression(node)) {
        results.push(...extractFromBlockStatement(node.body, path));
    }
    // Identifiers: resolve to their values if possible
    else if (t.isIdentifier(node)) {
        const resolved = resolveIdentifier(node, path);
        if (resolved) {
            results.push(...extractLiteralsRecursively(resolved, path));
        }
    }
    // Binary expressions: might contain literals in some cases
    else if (t.isBinaryExpression(node)) {
        // Only extract if it's a simple concatenation that might resolve to a literal
        if (node.operator === '+') {
            results.push(...extractLiteralsRecursively(node.left, path));
            results.push(...extractLiteralsRecursively(node.right, path));
        }
    }
    return results;
}
/**
 * Extract literals from block statements by finding return statements
 */
function extractFromBlockStatement(block, path) {
    const results = [];
    for (const stmt of block.body) {
        if (t.isReturnStatement(stmt) && stmt.argument) {
            results.push(...extractLiteralsRecursively(stmt.argument, path));
        }
    }
    return results;
}
/**
 * Try to resolve an identifier to its value within the current scope
 */
function resolveIdentifier(node, path) {
    const binding = path.scope.getBinding(node.name);
    if (!binding)
        return null;
    // Look at the binding's initialization
    const bindingPath = binding.path;
    // Variable declarator: const x = 'value'
    if (bindingPath.isVariableDeclarator() && bindingPath.node.init) {
        return bindingPath.node.init;
    }
    // Function parameter, import, etc. - could be extended
    return null;
}
/**
 * Convert various literal types to strings
 */
function literalToString(node) {
    if (t.isStringLiteral(node) || t.isNumericLiteral(node)) {
        return String(node.value);
    }
    if (t.isBooleanLiteral(node)) {
        return node.value ? 'true' : 'false';
    }
    if (t.isNullLiteral(node)) {
        return 'null';
    }
    if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
        // Simple template literal with no expressions: `hello`
        return node.quasis[0]?.value.cooked || null;
    }
    return null;
}
/**
 * Convert the harvested variants map to the final output format
 */
function normalizeVariants(variants, setters) {
    const result = [];
    for (const [stateKey, valueSet] of variants) {
        // Find the initial value from the original setter
        const setter = setters.find((s) => s.stateKey === stateKey);
        const initialValue = setter?.initialValue || null;
        // Sort values for deterministic output
        const sortedValues = Array.from(valueSet).sort();
        result.push({ key: stateKey, values: sortedValues, initialValue });
    }
    // Sort by key for deterministic output
    return result.sort((a, b) => a.key.localeCompare(b.key));
}
const fileCache = new Map();
/**
 * Main function: Extract all variant tokens from a JS/TS file
 * @param filePath - Path to the source file
 * @returns Array of variant data objects
 */
function extractVariants(filePath) {
    try {
        // Read and hash the file for caching
        const sourceCode = (0, fs_1.readFileSync)(filePath, 'utf-8');
        const fileHash = (0, crypto_1.createHash)('md5').update(sourceCode).digest('hex');
        // Check cache first
        const cached = fileCache.get(filePath);
        if (cached && cached.hash === fileHash) {
            return cached.variants;
        }
        // Parse the file once
        const ast = (0, parser_1.parse)(sourceCode, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy'],
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
        });
        // Pass 1: Collect all useUI setters and their initial values
        const setters = collectUseUISetters(ast);
        // Early return if no setters found
        if (setters.length === 0) {
            const result = [];
            fileCache.set(filePath, { hash: fileHash, variants: result });
            return result;
        }
        // Pass 2: Harvest all values from setter calls
        const variantsMap = harvestSetterValues(setters);
        // Normalize to final format
        const variants = normalizeVariants(variantsMap, setters);
        // Cache and return
        fileCache.set(filePath, { hash: fileHash, variants });
        return variants;
    }
    catch (error) {
        console.error(`Error extracting variants from ${filePath}:`, error);
        return [];
    }
}
/**
 * Extract variants from multiple files
 * @param filePaths - Array of file paths to analyze
 * @returns Combined and deduplicated variant data
 */
function extractVariantsFromFiles(filePaths) {
    const allVariants = new Map();
    const initialValues = new Map();
    for (const filePath of filePaths) {
        const fileVariants = extractVariants(filePath);
        for (const variant of fileVariants) {
            if (!allVariants.has(variant.key)) {
                allVariants.set(variant.key, new Set());
                initialValues.set(variant.key, variant.initialValue);
            }
            // Merge values
            variant.values.forEach((value) => allVariants.get(variant.key).add(value));
        }
    }
    // Convert back to VariantData format
    return Array.from(allVariants.entries())
        .map(([key, valueSet]) => ({ key, values: Array.from(valueSet).sort(), initialValue: initialValues.get(key) || null }))
        .sort((a, b) => a.key.localeCompare(b.key));
}
