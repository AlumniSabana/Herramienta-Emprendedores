import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { name: 'web', environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.ts'], include: ['tests/**/*.test.tsx'] },
  }),
);
