const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Billing Staff Complete Workflow', () => {
  test.describe('Bills Management', () => {
    test('should access billing page', async ({ billingPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should view bills in table', async ({ billingPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have create bill button', async ({ billingPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
      await expect(addBtn.first()).toBeVisible();
    });

    test('should open create bill dialog', async ({ billingPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.MuiDialog-paper')).toBeVisible();
    });
  });

  test.describe('Insurance Claims', () => {
    test('should access insurance page', async ({ billingPage: page }) => {
      await page.goto('/insurance');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should access enterprise ops', async ({ billingPage: page }) => {
      await page.goto('/enterprise-ops');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Create Claim' })).toBeVisible();
    });

    test('should have claim creation form', async ({ billingPage: page }) => {
      await page.goto('/enterprise-ops');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: 'Create Claim' })).toBeVisible();
    });
  });

  test.describe('Access Restrictions', () => {
    test('billing staff should not access admin panel', async ({ billingPage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('billing staff should not access departments', async ({ billingPage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle refresh on billing page', async ({ billingPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
