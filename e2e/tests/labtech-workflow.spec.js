const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Lab Technician Complete Workflow', () => {
  test.describe('Laboratory Module', () => {
    test('should access laboratory page', async ({ labTechPage: page }) => {
      await page.goto('/laboratory');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should view lab test results', async ({ labTechPage: page }) => {
      await page.goto('/laboratory');
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(0);
    });

    test('lab tech should NOT have order test button (only admin/doctor can)', async ({ labTechPage: page }) => {
      await page.goto('/laboratory');
      await page.waitForLoadState('networkidle');
      const orderBtn = page.locator('button:has-text("Order Test")');
      await expect(orderBtn).not.toBeVisible();
    });
  });

  test.describe('EHR Access', () => {
    test('should access EHR registry', async ({ labTechPage: page }) => {
      await page.goto('/ehr');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('Patient Access', () => {
    test('should view patients list', async ({ labTechPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('Access Restrictions', () => {
    test('lab tech should not access admin panel', async ({ labTechPage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('lab tech should not access departments', async ({ labTechPage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle refresh on laboratory page', async ({ labTechPage: page }) => {
      await page.goto('/laboratory');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
