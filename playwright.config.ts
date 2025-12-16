import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for MDReader E2E Tests
 * 
 * Expert-level test configuration with:
 * - Headless mode for CI/CD
 * - Headed mode for debugging
 * - Video recording on failure
 * - Screenshot on failure
 * - Retry logic
 */

export default defineConfig({
  testDir: './',
  testMatch: ['**/e2e/**/*.spec.ts', '**/tests/e2e/**/*.spec.ts'],
  
  /* Maximum time one test can run */
  timeout: 30 * 1000,
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5174',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Force a deterministic port so baseURL is stable (prevents "passes" on wrong port / blank page).
    command: 'rm -rf frontend/node_modules/.vite && cd frontend && npm run dev -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    // Temporarily allow reusing existing server for testing
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

