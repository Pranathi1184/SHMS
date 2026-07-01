const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Receptionist Complete Workflow', () => {
  test.describe('Patient Registration', () => {
    test('should access patients list', async ({ receptionistPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should have add patient button', async ({ receptionistPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add Patient"), a:has-text("Add Patient"), a[href="/patients/add"]');
      await expect(addBtn).toBeVisible();
    });

    test('should navigate to add patient wizard', async ({ receptionistPage: page }) => {
      await page.goto('/patients/add');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Identity')).toBeVisible();
    });

    test('should search patients by name', async ({ receptionistPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await search.fill('Ananya');
      await page.waitForTimeout(1500);
    });
  });

  test.describe('Appointment Booking', () => {
    test('should access appointments list', async ({ receptionistPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should have book appointment button', async ({ receptionistPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const bookBtn = page.locator('button:has-text("Book Appointment")');
      await expect(bookBtn).toBeVisible();
    });

    test('should open booking dialog with patient/doctor dropdowns', async ({ receptionistPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.locator('button:has-text("Book Appointment")').click();
      await page.waitForTimeout(1000);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
      // Should have form inputs for selecting patient and doctor
      const inputs = dialog.locator('input, .MuiAutocomplete-root');
      expect(await inputs.count()).toBeGreaterThan(0);
    });

    test('should filter appointments', async ({ receptionistPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await expect(search).toBeVisible();
    });
  });

  test.describe('Doctor Availability', () => {
    test('should view doctors list', async ({ receptionistPage: page }) => {
      await page.goto('/doctors');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should search doctors', async ({ receptionistPage: page }) => {
      await page.goto('/doctors');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await search.fill('Dr');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Access Restrictions', () => {
    test('receptionist should not access admin panel', async ({ receptionistPage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('receptionist should not access departments', async ({ receptionistPage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle refresh on patients page', async ({ receptionistPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
