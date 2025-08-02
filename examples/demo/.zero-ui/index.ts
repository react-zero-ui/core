export const zeroSSR = { onClick: <const V extends string[]>(key: string, vals: [...V]) => ({ 'data-ui': `cycle:${key}(${vals.join(',')})` }) as const };
