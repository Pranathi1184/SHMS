const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Patients Module', () => {
  test.describe('Patients List', () => {
    test('should display patients table with data', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const table = page.locator('table');
      await expect(table).toBeVisible();
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should have search functionality', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const searchInput = page.locator('input[placeholder*="earch"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Ananya');
      await page.waitForTimeout(1000);
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have pagination', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const pagination = page.locator('.MuiPagination-root, nav[aria-label="pagination"]');
      await expect(pagination).toBeVisible();
    });

    test('should have Add Patient button', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add Patient"), a:has-text("Add Patient"), a[href="/patients/add"]');
      await expect(addBtn).toBeVisible();
    });

    test('should navigate to add patient page', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button:has-text("Add Patient"), a:has-text("Add Patient"), a[href="/patients/add"]');
      await addBtn.click();
      await page.waitForURL('**/patients/add');
    });
  });

  test.describe('Add Patient (Wizard Form)', () => {
    test('should display stepper with 3 steps', async ({ adminPage: page }) => {
      await page.goto('/patients/add');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Identity')).toBeVisible();
      await expect(page.locator('text=Contact')).toBeVisible();
      await expect(page.locator('text=Clinical')).toBeVisible();
    });

    test('should show step 1 fields (Identity)', async ({ adminPage: page }) => {
      await page.goto('/patients/add');
      await page.waitForLoadState('networkidle');
      await expect(page.getByLabel('First Name')).toBeVisible();
      await expect(page.getByLabel('Last Name')).toBeVisible();
      await expect(page.getByLabel('Date of Birth')).toBeVisible();
      await expect(page.getByLabel('Gender')).toBeVisible();
    });

    test('should show validation errors on empty Next click', async ({ adminPage: page }) => {
      await page.goto('/patients/add');
      await page.waitForLoadState('networkidle');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      // Should show validation error messages
      await expect(page.locator('text=/required/i').first()).toBeVisible();
    });

    test('should navigate to step 2 when step 1 is valid', async ({ adminPage: page }) => {
      await page.goto('/patients/add');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('First Name').fill('Test');
      await page.getByLabel('Last Name').fill('Patient');
      await page.getByLabel('Date of Birth').fill('1990-01-01');
      // Select gender (MUI Select TextField)
      const genderSelect = page.locator('label:has-text("Gender")').locator('..').locator('div[role="combobox"], .MuiSelect-select');
      if (await genderSelect.isVisible().catch(() => false)) {
        await genderSelect.click();
      } else {
        await page.getByLabel('Gender').click();
      }
      await page.waitForTimeout(300);
      await page.getByRole('option', { name: 'Male', exact: true }).click();
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      // Should now show Contact step fields
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Phone')).toBeVisible();
    });
  });

  test.describe('Patient Permissions', () => {
    test('admin can access patients list', async ({ adminPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });

    test('doctor can access patients list', async ({ doctorPage: page }) => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible();
    });
  });
});
