const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Nurse Complete Workflow', () => {
  test.describe('Dashboard', () => {
    test('should display nurse dashboard', async ({ nursePage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Patient Management', () => {
    test('should view patients list', async ({ nursePage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should search patients', async ({ nursePage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await search.fill('Ananya');
      await page.waitForTimeout(1500);
    });
  });

  test.describe('Ward Management', () => {
    test('should access ward management', async ({ nursePage: page }) => {
      await page.goto('/wards');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
      const content = await page.locator('main').textContent();
      expect(content.length).toBeGreaterThan(10);
    });
  });

  test.describe('Appointments', () => {
    test('should view appointments', async ({ nursePage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('EHR Access', () => {
    test('should access EHR records', async ({ nursePage: page }) => {
      await page.goto('/ehr');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('Access Restrictions', () => {
    test('nurse should not access admin panel', async ({ nursePage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('nurse should not access departments', async ({ nursePage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle refresh on patients page', async ({ nursePage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
