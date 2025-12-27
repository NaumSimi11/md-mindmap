import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Run with: npx playwright test
 * Debug with: npx playwright test --ui
 * 
 * Prerequisites:
 * - Backend running (./start-services.sh or start-services.bat)
 * - Frontend running (npm run dev)
 * - Test users created (run with -WithUser flag)
 */
export default defineConfig({
  testDir: './e2e',
  
  // Run tests in parallel for speed
  fullyParallel: true,
  
  // Fail CI builds on .only() to prevent accidental commits
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,
  
  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github' as const]] : []),
  ],

  // Test timeout (per test)
  timeout: 30000,

  // Assertion timeout
  expect: {
    timeout: 5000,
  },
  
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5173',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure (useful for debugging)
    video: 'on-first-retry',
    
    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test in Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  // Web server configuration - starts frontend if not running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});

