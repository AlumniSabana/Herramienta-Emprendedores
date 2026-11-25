import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { projects: ['packages/core', 'apps/web', { test: { name: 'api', include: ['api/**/*.test.ts'] } }] },
});
