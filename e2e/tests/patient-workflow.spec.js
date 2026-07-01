const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Patient Complete Workflow', () => {
  test.describe('Dashboard', () => {
    test('should display patient dashboard', async ({ patientPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should show limited sidebar items', async ({ patientPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      // Patient should see specific items
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Appointments', () => {
    test('should view appointments', async ({ patientPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should have appointment booking capability', async ({ patientPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const bookBtn = page.locator('button:has-text("Book Appointment"), button:has-text("Book")');
      await expect(bookBtn.first()).toBeVisible();
    });
  });

  test.describe('Prescriptions', () => {
    test('should view prescriptions', async ({ patientPage: page }) => {
      await page.goto('/prescriptions');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Doctors', () => {
    test('should view doctors list', async ({ patientPage: page }) => {
      await page.goto('/doctors');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('AI Features', () => {
    test('should access AI center', async ({ patientPage: page }) => {
      await page.goto('/ai-center');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Access Restrictions', () => {
    test('patient should not access admin panel', async ({ patientPage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('patient should not access departments', async ({ patientPage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('patient should not access EHR', async ({ patientPage: page }) => {
      await page.goto('/ehr');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('patient should not access billing', async ({ patientPage: page }) => {
      await page.goto('/billing');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('patient should not access insurance', async ({ patientPage: page }) => {
      await page.goto('/insurance');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('patient should not access enterprise ops', async ({ patientPage: page }) => {
      await page.goto('/enterprise-ops');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle refresh on appointments', async ({ patientPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle back/forward navigation', async ({ patientPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.goto('/doctors');
      await page.waitForLoadState('networkidle');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/appointments');
    });
  });
});
