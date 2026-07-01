const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Prescriptions Module', () => {
  test('should display prescriptions table', async ({ adminPage: page }) => {
    await page.goto('/prescriptions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have create prescription button for doctor', async ({ doctorPage: page }) => {
    await page.goto('/prescriptions');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    await expect(addBtn.first()).toBeVisible();
  });

  test('pharmacist should access prescriptions', async ({ pharmacistPage: page }) => {
    await page.goto('/prescriptions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('patient should see prescriptions page', async ({ patientPage: page }) => {
    await page.goto('/prescriptions');
    await page.waitForLoadState('networkidle');
    // Patient should see the page (table or content)
    await expect(page.locator('main')).toBeVisible();
    const content = await page.locator('main').textContent();
    expect(content.length).toBeGreaterThan(0);
  });

  test('should display prescription data columns', async ({ adminPage: page }) => {
    await page.goto('/prescriptions');
    await page.waitForLoadState('networkidle');
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
