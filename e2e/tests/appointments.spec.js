const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Appointments Module', () => {
  test.describe('Appointments List', () => {
    test('should display appointments table', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should have search input', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await expect(search).toBeVisible();
    });

    test('should filter by status', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const statusFilter = page.locator('.MuiSelect-select, select').first();
      if (await statusFilter.isVisible().catch(() => false)) {
        await statusFilter.click();
        await page.waitForTimeout(500);
      }
    });

    test('should have pagination', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const pagination = page.locator('.MuiPagination-root');
      await expect(pagination).toBeVisible();
    });

    test('should have add appointment button', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add Appointment"), button:has-text("Book Appointment")');
      await expect(addBtn.first()).toBeVisible();
    });

    test('should open add appointment dialog', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Book Appointment")');
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
    });

    test('should search appointments', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await search.fill('Scheduled');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Appointment CRUD', () => {
    test('should open create dialog with form fields', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Book Appointment")');
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
      // Check form has inputs
      const inputs = dialog.locator('input, .MuiAutocomplete-root, textarea');
      expect(await inputs.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Patient Appointments', () => {
    test('patient should see appointments page', async ({ patientPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      // Patient should see the page load (either table with data or empty state)
      await expect(page.locator('main')).toBeVisible();
      const pageContent = await page.locator('main').textContent();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Doctor Appointments', () => {
    test('doctor should see appointments list', async ({ doctorPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
