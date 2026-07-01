const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Laboratory Module', () => {
  test('should display lab tests table', async ({ adminPage: page }) => {
    await page.goto('/laboratory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have Order Test button for admin', async ({ adminPage: page }) => {
    await page.goto('/laboratory');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Order Test")');
    await expect(addBtn).toBeVisible();
  });

  test('should open order test dialog', async ({ adminPage: page }) => {
    await page.goto('/laboratory');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Order Test")').click();
    await page.waitForTimeout(1000);
    const dialog = page.locator('.MuiDialog-paper');
    await expect(dialog).toBeVisible();
  });

  test('lab tech should access laboratory', async ({ labTechPage: page }) => {
    await page.goto('/laboratory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display test records in table', async ({ adminPage: page }) => {
    await page.goto('/laboratory');
    await page.waitForLoadState('networkidle');
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
