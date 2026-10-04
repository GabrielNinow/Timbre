import { defineConfig, devices } from '@playwright/test'

const BROWSERS_ONLY = /@mobile|@trace-demo/

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  // Each worker runs its own API process (support/fixtures.ts), so parallelism is safe.
  workers: 3,
  // Flakiness gets fixed, not retried (docs/testability.md, CI).
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  webServer: {
    // The production build (made by `npm run playwright`), served by vite preview.
    command: 'npm run app:preview',
    cwd: '..',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: BROWSERS_ONLY },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: BROWSERS_ONLY },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grepInvert: BROWSERS_ONLY },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    // Deliberately failing, with a trace attached: run with `npm run pw:trace-demo`.
    { name: 'trace-demo', use: { ...devices['Desktop Chrome'], trace: 'on' }, grep: /@trace-demo/ },
  ],
})
