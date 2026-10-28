import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE = `/${(process.env['BASE_PATH'] ?? '').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');

// Proyecto único (móvil Chromium); la matriz 3 navegadores × 3 viewports llega en T-018.
export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
