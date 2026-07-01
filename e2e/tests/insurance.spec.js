const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Insurance Module', () => {
  test('should display insurance list', async ({ adminPage: page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have add insurance button', async ({ adminPage: page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Insurance"), button:has-text("Add")');
    await expect(addBtn.first()).toBeVisible();
  });

  test('should open add insurance dialog', async ({ adminPage: page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Insurance"), button:has-text("Add")');
    await addBtn.first().click();
    await page.waitForTimeout(1000);
    const dialog = page.locator('.MuiDialog-paper');
    await expect(dialog).toBeVisible();
  });

  test('billing staff should access insurance', async ({ billingPage: page }) => {
    await page.goto('/insurance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('patient should not access insurance', async ({ patientPage: page }) => {
    await page.goto('/insurance');
    await page.waitForTimeout(2000);
    const url = page.url();
    const content = await page.content();
    const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
    expect(isRestricted).toBeTruthy();
  });
});
