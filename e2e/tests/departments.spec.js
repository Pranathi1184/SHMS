const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Departments Module (Admin Only)', () => {
  test('should display departments list', async ({ adminPage: page }) => {
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should have Add Department button', async ({ adminPage: page }) => {
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Department")');
    await expect(addBtn).toBeVisible();
  });

  test('should open add department dialog', async ({ adminPage: page }) => {
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Add Department")').click();
    await page.waitForTimeout(500);
    const dialog = page.locator('.MuiDialog-paper');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Add Department')).toBeVisible();
  });

  test('should show action buttons (edit/delete) for departments', async ({ adminPage: page }) => {
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');
    // Departments use IconButtons (Edit/Delete icons)
    const iconBtns = page.locator('table tbody tr .MuiIconButton-root, table tbody tr button');
    expect(await iconBtns.count()).toBeGreaterThan(0);
  });

  test('non-admin should not access departments', async ({ doctorPage: page }) => {
    await page.goto('/departments');
    await page.waitForTimeout(2000);
    const url = page.url();
    const content = await page.content();
    const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
    expect(isRestricted).toBeTruthy();
  });
});
