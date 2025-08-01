import requireDataAttr from './src/rules/require-data-attr.js';

export const rules = { 'require-data-attr': requireDataAttr } as const;

// recommended config for users
export const configs = { recommended: { plugins: ['react-zero-ui'], rules: { 'react-zero-ui/require-data-attr': 'error' } } } as const;
