import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
