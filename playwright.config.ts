import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

/**
 * The suite runs against a real server because the checks that matter here are
 * layout and navigation: bounding boxes of the slug field, and the publish
 * round trip that ends on /g/<slug>. A dev server on port 3001 is reused if it
 * is already running.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      // Chromium at a phone viewport: the layout assertions are about CSS
      // boxes, so the engine does not matter, and only Chromium is installed.
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: false },
    },
  ],
})
