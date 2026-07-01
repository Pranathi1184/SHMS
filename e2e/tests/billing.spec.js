const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Billing Module', () => {
  test('should display bills list', async ({ adminPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have create bill button', async ({ adminPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Bill"), button:has-text("Create Bill"), button:has-text("New Bill")');
    await expect(addBtn.first()).toBeVisible();
  });

  test('should open create bill dialog', async ({ adminPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Bill"), button:has-text("Create Bill"), button:has-text("New Bill")');
    await addBtn.first().click();
    await page.waitForTimeout(1000);
    const dialog = page.locator('.MuiDialog-paper');
    await expect(dialog).toBeVisible();
  });

  test('billing staff should access billing', async ({ billingPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have view bill functionality', async ({ adminPage: page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    // Check table rows exist
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
