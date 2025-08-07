// postcss.config.mjs
// has to just the build version of the postcss plugin NO TS
const config = { plugins: ['../../dist/postcss/index.cjs', '@tailwindcss/postcss'] };
export default config;
