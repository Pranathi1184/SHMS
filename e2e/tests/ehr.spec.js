const { test, expect } = require('../fixtures/auth.fixture');

test.describe('EHR Module', () => {
  test('should display EHR page with heading', async ({ adminPage: page }) => {
    await page.goto('/ehr');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Electronic Health Records')).toBeVisible();
  });

  test('should show EHR table with records', async ({ adminPage: page }) => {
    await page.goto('/ehr');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have Add EHR button', async ({ adminPage: page }) => {
    await page.goto('/ehr');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add EHR")');
    await expect(addBtn).toBeVisible();
  });

  test('should display EHR registry list', async ({ adminPage: page }) => {
    await page.goto('/ehr-list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('doctor should access EHR', async ({ doctorPage: page }) => {
    await page.goto('/ehr');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Electronic Health Records')).toBeVisible();
  });

  test('lab tech should access EHR registry', async ({ labTechPage: page }) => {
    await page.goto('/ehr-list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table')).toBeVisible();
  });

  test('patient should not access EHR', async ({ patientPage: page }) => {
    await page.goto('/ehr');
    await page.waitForTimeout(2000);
    const url = page.url();
    const content = await page.content();
    const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
    expect(isRestricted).toBeTruthy();
  });
});
