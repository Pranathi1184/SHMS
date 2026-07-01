const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Dashboard', () => {
  test.describe('Admin Dashboard', () => {
    test('should display welcome message', async ({ adminPage: page }) => {
      await expect(page.locator('h4:has-text("Welcome back")')).toBeVisible();
    });

    test('should display all stat cards', async ({ adminPage: page }) => {
      await expect(page.locator('main').getByText('Revenue (Filtered)')).toBeVisible();
      await expect(page.locator('main').getByText('Total Patients')).toBeVisible();
      await expect(page.locator('main').getByText('Departments', { exact: true })).toBeVisible();
      await expect(page.locator('main').getByText('Low Stock Medicines', { exact: true })).toBeVisible();
      await expect(page.locator('main').getByText('Occupancy Rate')).toBeVisible();
    });

    test('should display report filters', async ({ adminPage: page }) => {
      await expect(page.locator('text=Report Filters')).toBeVisible();
      await expect(page.locator('input[type="date"]').first()).toBeVisible();
      await expect(page.locator('button:has-text("Apply Filters")')).toBeVisible();
      await expect(page.locator('button:has-text("Reset")')).toBeVisible();
    });

    test('should display capacity heatmap table', async ({ adminPage: page }) => {
      const heatmap = page.locator('text=Capacity Heatmap (Doctor Time Blocks)');
      await expect(heatmap).toBeVisible();
      const table = page.locator('main table').first();
      await expect(table).toBeVisible();
    });

    test('should apply date filters', async ({ adminPage: page }) => {
      const fromDate = page.locator('input[type="date"]').first();
      await fromDate.fill('2026-06-01');
      const toDate = page.locator('input[type="date"]').nth(1);
      await toDate.fill('2026-06-30');
      await page.locator('button:has-text("Apply Filters")').click();
      await page.waitForTimeout(2000);
      await expect(page.locator('main').getByText('Revenue (Filtered)')).toBeVisible();
    });

    test('should reset filters', async ({ adminPage: page }) => {
      const fromDate = page.locator('input[type="date"]').first();
      await fromDate.fill('2026-06-01');
      await page.locator('button:has-text("Apply Filters")').click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Reset")').click();
      await page.waitForTimeout(1000);
      const fromVal = await fromDate.inputValue();
      expect(fromVal).toBe('');
    });

    test('should show charts section when scrolled', async ({ adminPage: page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await expect(page.locator('text=Revenue by Day')).toBeVisible();
      await expect(page.locator('text=Patients by Gender')).toBeVisible();
      await expect(page.locator('text=Department Workload')).toBeVisible();
    });

    test('should show export buttons', async ({ adminPage: page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const csvButtons = page.locator('button:has-text("Export CSV"), button:has-text("CSV")');
      expect(await csvButtons.count()).toBeGreaterThan(0);
    });

    test('should display sidebar navigation items for admin', async ({ adminPage: page }) => {
      const expectedItems = ['Dashboard', 'Patients', 'Appointments', 'Doctors', 'Departments', 
        'EHR', 'Laboratory', 'Pharmacy', 'Prescriptions', 'Insurance', 'Billing', 'AI Center'];
      for (const item of expectedItems) {
        await expect(page.locator(`nav >> text=${item}`).first()).toBeVisible();
      }
    });

    test('should navigate to patients from sidebar', async ({ adminPage: page }) => {
      await page.locator('nav').getByText('Patients', { exact: true }).click();
      await page.waitForURL('**/patients', { timeout: 15000 });
    });
  });

  test.describe('Doctor Dashboard', () => {
    test('should display doctor-specific content', async ({ doctorPage: page }) => {
      await expect(page.locator('h4:has-text("Welcome back")')).toBeVisible();
    });

    test('should show doctor sidebar items', async ({ doctorPage: page }) => {
      await expect(page.locator('nav >> text=Patients').first()).toBeVisible();
      await expect(page.locator('nav >> text=Appointments').first()).toBeVisible();
      await expect(page.locator('nav >> text=EHR').first()).toBeVisible();
    });
  });

  test.describe('Patient Dashboard', () => {
    test('should display patient-specific content', async ({ patientPage: page }) => {
      await expect(page.locator('h4:has-text("Welcome back")')).toBeVisible();
    });

    test('should show limited sidebar items for patient', async ({ patientPage: page }) => {
      await expect(page.locator('nav >> text=My Profile').first()).toBeVisible();
      await expect(page.locator('nav >> text=My Appointments').first()).toBeVisible();
      await expect(page.locator('nav >> text=My Prescriptions').first()).toBeVisible();
      // Should NOT see admin items
      await expect(page.locator('nav >> text=Admin')).toHaveCount(0);
      await expect(page.locator('nav >> text=Departments')).toHaveCount(0);
    });
  });
});
