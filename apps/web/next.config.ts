import type { NextConfig } from 'next';
import path from 'node:path';

const monorepoRoot = path.resolve(__dirname, '../..');

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
