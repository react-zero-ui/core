import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async redirects() {
    return [
      {
        source: '/icon-sprite',
        destination: '/',
        permanent: true,
      },
      {
        source: '/react',
        destination: '/demo/real-world',
        permanent: true,
      },
      {
        source: '/zero-ui',
        destination: '/demo/real-world',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
