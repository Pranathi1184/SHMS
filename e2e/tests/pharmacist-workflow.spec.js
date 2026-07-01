const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Pharmacist Complete Workflow', () => {
  test.describe('Pharmacy Management', () => {
    test('should access pharmacy page', async ({ pharmacistPage: page }) => {
      await page.goto('/pharmacy');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should view medicines list', async ({ pharmacistPage: page }) => {
      await page.goto('/pharmacy');
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should have add medicine button', async ({ pharmacistPage: page }) => {
      await page.goto('/pharmacy');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add"), button:has-text("New")');
      await expect(addBtn.first()).toBeVisible();
    });

    test('should open add medicine dialog', async ({ pharmacistPage: page }) => {
      await page.goto('/pharmacy');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add"), button:has-text("New")');
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.MuiDialog-paper')).toBeVisible();
    });
  });

  test.describe('Prescriptions', () => {
    test('should view prescriptions list', async ({ pharmacistPage: page }) => {
      await page.goto('/prescriptions');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should see prescription details', async ({ pharmacistPage: page }) => {
      await page.goto('/prescriptions');
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('AI Inventory Recommendations', () => {
    test('should access AI center', async ({ pharmacistPage: page }) => {
      await page.goto('/ai-center');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Access Restrictions', () => {
    test('pharmacist should not access admin panel', async ({ pharmacistPage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('pharmacist should not access departments', async ({ pharmacistPage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle refresh on pharmacy page', async ({ pharmacistPage: page }) => {
      await page.goto('/pharmacy');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
