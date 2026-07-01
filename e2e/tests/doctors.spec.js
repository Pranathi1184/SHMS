const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Doctors Module', () => {
  test('should display doctors list', async ({ adminPage: page }) => {
    await page.goto('/doctors');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should have search functionality', async ({ adminPage: page }) => {
    await page.goto('/doctors');
    await page.waitForLoadState('networkidle');
    const search = page.locator('input[placeholder*="earch"]');
    await expect(search).toBeVisible();
    await search.fill('Aarav');
    await page.waitForTimeout(1000);
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should have Add Doctor button for admin', async ({ adminPage: page }) => {
    await page.goto('/doctors');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Doctor")');
    await expect(addBtn).toBeVisible();
  });

  test('should open add doctor dialog', async ({ adminPage: page }) => {
    await page.goto('/doctors');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Add Doctor")').click();
    await page.waitForTimeout(1000);
    const dialog = page.locator('.MuiDialog-paper');
    await expect(dialog).toBeVisible();
  });

  test('patient should see doctors list', async ({ patientPage: page }) => {
    await page.goto('/doctors');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });
});
