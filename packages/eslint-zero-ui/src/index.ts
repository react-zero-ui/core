import requireDataAttr from './rules/require-data-attr.js';

const rules = { 'require-data-attr': requireDataAttr } as const;

// recommended config for users
const configs = { recommended: { plugins: ['react-zero-ui'], rules: { 'react-zero-ui/require-data-attr': 'error' } } } as const;

export default { rules, configs };
