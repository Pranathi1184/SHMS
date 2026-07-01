const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Doctor Complete Workflow', () => {
  test.describe('Doctor Dashboard', () => {
    test('should display doctor-specific dashboard content', async ({ doctorPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
      const content = await page.locator('main').textContent();
      expect(content.length).toBeGreaterThan(10);
    });

    test('should show appointment-related info', async ({ doctorPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      // Doctor dashboard should show appointments or patients info
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Appointments', () => {
    test('should view appointments list', async ({ doctorPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should have appointment booking capability', async ({ doctorPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const bookBtn = page.locator('button:has-text("Book Appointment")');
      await expect(bookBtn).toBeVisible();
    });

    test('should open appointment booking dialog', async ({ doctorPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.locator('button:has-text("Book Appointment")').click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.MuiDialog-paper')).toBeVisible();
    });
  });

  test.describe('Patient Records', () => {
    test('should view patients list', async ({ doctorPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should search patients', async ({ doctorPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await search.fill('Ananya');
      await page.waitForTimeout(1500);
    });
  });

  test.describe('EHR Access', () => {
    test('should access EHR module', async ({ doctorPage: page }) => {
      await page.goto('/ehr');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should have EHR management capabilities', async ({ doctorPage: page }) => {
      await page.goto('/ehr');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      await expect(addBtn.first()).toBeVisible();
    });
  });

  test.describe('Prescriptions', () => {
    test('should view prescriptions list', async ({ doctorPage: page }) => {
      await page.goto('/prescriptions');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should have create prescription button', async ({ doctorPage: page }) => {
      await page.goto('/prescriptions');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      await expect(addBtn.first()).toBeVisible();
    });
  });

  test.describe('Laboratory Results', () => {
    test('should access laboratory', async ({ doctorPage: page }) => {
      await page.goto('/laboratory');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('AI Features', () => {
    test('should access AI center', async ({ doctorPage: page }) => {
      await page.goto('/ai-center');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should have AI action buttons', async ({ doctorPage: page }) => {
      await page.goto('/ai-center');
      await page.waitForLoadState('networkidle');
      const buttons = page.locator('main button');
      expect(await buttons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Access Restrictions', () => {
    test('doctor should not access admin panel', async ({ doctorPage: page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });

    test('doctor should not access departments management', async ({ doctorPage: page }) => {
      await page.goto('/departments');
      await page.waitForTimeout(2000);
      const url = page.url();
      const content = await page.content();
      const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
      expect(isRestricted).toBeTruthy();
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle page refresh on appointments', async ({ doctorPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should handle back/forward navigation', async ({ doctorPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/patients');
    });
  });
});
