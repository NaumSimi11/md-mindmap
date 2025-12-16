import { test, expect } from '@playwright/test';

// This test enforces a hard invariant:
// Guest mode must NOT attempt to connect to Hocuspocus (ws://localhost:1234).

test('guest mode should not open Hocuspocus websocket', async ({ page }) => {
  const wsUrls: string[] = [];
  page.on('websocket', (ws) => {
    wsUrls.push(ws.url());
  });

  // Go straight to the workspace; landing page may not mount the sidebar.
  await page.goto('/workspace');
  await page.waitForLoadState('networkidle');

  // Give initialization time for any background connections
  await page.waitForTimeout(3000);

  const hocuspocusSockets = wsUrls.filter((u) => u.includes('localhost:1234'));

  expect(hocuspocusSockets, `Unexpected Hocuspocus websocket(s): ${hocuspocusSockets.join(', ')}`).toHaveLength(0);
});
