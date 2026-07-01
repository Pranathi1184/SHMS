const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Pharmacy Module', () => {
  test('should display medicines list', async ({ adminPage: page }) => {
    await page.goto('/pharmacy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should have add medicine button', async ({ adminPage: page }) => {
    await page.goto('/pharmacy');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New")');
    await expect(addBtn.first()).toBeVisible();
  });

  test('should open add medicine dialog', async ({ adminPage: page }) => {
    await page.goto('/pharmacy');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New")');
    await addBtn.first().click();
    await page.waitForTimeout(1000);
    const dialog = page.locator('.MuiDialog-paper');
    await expect(dialog).toBeVisible();
  });

  test('pharmacist should access pharmacy', async ({ pharmacistPage: page }) => {
    await page.goto('/pharmacy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display medicine details in table', async ({ adminPage: page }) => {
    await page.goto('/pharmacy');
    await page.waitForLoadState('networkidle');
    const table = page.locator('table');
    await expect(table).toBeVisible();
    // Table should have medicine data columns
    const headers = page.locator('table thead th');
    expect(await headers.count()).toBeGreaterThan(3);
  });
});
