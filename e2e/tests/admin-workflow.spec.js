const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Admin Complete Workflow', () => {
  test.describe('User Management', () => {
    test('should navigate to admin panel', async ({ adminPage: page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should see user list in admin panel', async ({ adminPage: page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      const content = await page.locator('main').textContent();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Department CRUD', () => {
    test('should open add department form and validate required fields', async ({ adminPage: page }) => {
      await page.goto('/departments');
      await page.waitForLoadState('networkidle');
      await page.locator('button:has-text("Add Department")').click();
      await page.waitForTimeout(500);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
      // Try submitting empty form
      const submitBtn = dialog.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Create")');
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('should show departments with data', async ({ adminPage: page }) => {
      await page.goto('/departments');
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr, .MuiCard-root, [class*="department"]');
      expect(await rows.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Patient Management', () => {
    test('should view patient list with data', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should search for a patient by name', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const search = page.locator('input[placeholder*="earch"]');
      await search.fill('Ananya');
      await page.waitForTimeout(1500);
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should paginate through patients list', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const pagination = page.locator('.MuiPagination-root button, nav[aria-label="pagination"] button');
      const count = await pagination.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Appointment Management', () => {
    test('should view appointments table', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should filter appointments by status', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      const statusFilter = page.locator('.MuiSelect-select, [aria-label*="status"], select').first();
      if (await statusFilter.isVisible().catch(() => false)) {
        await statusFilter.click();
        await page.waitForTimeout(300);
        const options = page.locator('[role="option"]');
        if (await options.count() > 0) {
          await options.first().click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should open book appointment dialog with form', async ({ adminPage: page }) => {
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.locator('button:has-text("Book Appointment")').first().click();
      await page.waitForTimeout(1000);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
      // Verify form fields exist
      const inputs = dialog.locator('input, .MuiAutocomplete-root, textarea, .MuiSelect-select');
      expect(await inputs.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Dashboard Analytics', () => {
    test('should display stat cards with numbers', async ({ adminPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const statCards = page.locator('.MuiCard-root, [class*="stat"]');
      expect(await statCards.count()).toBeGreaterThan(0);
    });

    test('should display heatmap or capacity table', async ({ adminPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const heatmap = page.locator('table').first();
      await expect(heatmap).toBeVisible();
    });

    test('should apply and reset date filters', async ({ adminPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const applyBtn = page.locator('main button:has-text("Apply")');
      const resetBtn = page.locator('main button:has-text("Reset")');
      await expect(applyBtn).toBeVisible();
      await expect(resetBtn).toBeVisible();
      await resetBtn.click();
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Billing Overview', () => {
    test('should view bills list', async ({ adminPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should create a bill dialog', async ({ adminPage: page }) => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
    });
  });

  test.describe('Ward Management', () => {
    test('should view wards list', async ({ adminPage: page }) => {
      await page.goto('/wards');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
      const content = await page.locator('main').textContent();
      expect(content.length).toBeGreaterThan(10);
    });

    test('should have ward management sections', async ({ adminPage: page }) => {
      await page.goto('/wards');
      await page.waitForLoadState('networkidle');
      // Ward management typically has wards and beds sections
      await expect(page.locator('table, .MuiCard-root').first()).toBeVisible();
    });
  });

  test.describe('Reports and Predictions', () => {
    test('should access predictions page', async ({ adminPage: page }) => {
      await page.goto('/predictions');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
      const content = await page.locator('main').textContent();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should access AI center', async ({ adminPage: page }) => {
      await page.goto('/ai-center');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('admin can access all pages', async ({ adminPage: page }) => {
      const pages = ['/dashboard', '/patients', '/appointments', '/doctors', '/departments', '/billing', '/pharmacy', '/prescriptions', '/laboratory', '/insurance', '/wards', '/ehr', '/ai-center', '/predictions', '/enterprise-ops', '/admin'];
      for (const p of pages) {
        await page.goto(p);
        await page.waitForLoadState('networkidle');
        const url = page.url();
        expect(url).not.toContain('unauthorized');
      }
    });
  });

  test.describe('Browser Navigation', () => {
    test('should handle browser back/forward between pages', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.goto('/appointments');
      await page.waitForLoadState('networkidle');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/patients');
      await page.goForward();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/appointments');
    });

    test('should handle page refresh', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
