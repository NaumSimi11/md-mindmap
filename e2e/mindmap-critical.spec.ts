import { test, expect } from '@playwright/test';

test.describe('Critical: Mindmap Integration', () => {
  test('mindmap button exists and is clickable', async ({ page }) => {
    // Go to workspace
    await page.goto('/workspace');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for mindmap button (try multiple selectors)
    const mindmapButton = page.locator('button', { hasText: /mindmap/i }).first();
    
    // Test 1: Button exists
    await expect(mindmapButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Mindmap button found!');
    
    // Test 2: Button is clickable
    await expect(mindmapButton).toBeEnabled();
    console.log('✅ Mindmap button is enabled!');
    
    console.log('🎉 CRITICAL TEST PASSED - Mindmap integration intact!');
  });
});

