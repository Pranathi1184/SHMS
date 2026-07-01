const { test, expect } = require('../fixtures/auth.fixture');

test.describe('AI Center', () => {
  test('should display AI center page', async ({ adminPage: page }) => {
    await page.goto('/ai-center');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/AI|assistant|chat|center/i').first()).toBeVisible();
  });

  test('should have action buttons', async ({ adminPage: page }) => {
    await page.goto('/ai-center');
    await page.waitForLoadState('networkidle');
    // AI Center has "Generate" and "Ask" buttons, not a "Send" button
    const actionBtn = page.locator('button:has-text("Generate"), button:has-text("Ask"), button:has-text("Run")');
    await expect(actionBtn.first()).toBeVisible();
  });

  test('should have chatbot section with Ask button', async ({ adminPage: page }) => {
    await page.goto('/ai-center');
    await page.waitForLoadState('networkidle');
    const askBtn = page.locator('button:has-text("Ask")');
    await expect(askBtn).toBeVisible();
  });

  test('patient should access AI center', async ({ patientPage: page }) => {
    await page.goto('/ai-center');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/AI|assistant|chat|center/i').first()).toBeVisible();
  });

  test('should have floating AI assistant on other pages', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const fab = page.locator('button[aria-label*="AI"], button[aria-label*="assistant"]');
    await expect(fab).toBeVisible();
  });
});
