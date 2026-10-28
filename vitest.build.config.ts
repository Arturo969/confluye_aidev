import { defineConfig } from 'vitest/config';

// Tests que ejecutan `astro build` completo: lentos, fuera de `npm test`.
export default defineConfig({
  test: {
    include: ['tests/build/**/*.test.ts'],
    testTimeout: 120_000,
    fileParallelism: false,
  },
});
