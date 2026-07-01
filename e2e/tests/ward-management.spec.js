const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Ward Management Module', () => {
  test('should display ward management page', async ({ adminPage: page }) => {
    await page.goto('/ward-management');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('should have add ward button', async ({ adminPage: page }) => {
    await page.goto('/ward-management');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("Add Ward"), button:has-text("Add"), button:has-text("Create")');
    await expect(addBtn.first()).toBeVisible();
  });

  test('should display beds section', async ({ adminPage: page }) => {
    await page.goto('/ward-management');
    await page.waitForLoadState('networkidle');
    // Look for beds tab or section
    const bedsSection = page.locator('text=/bed/i');
    await expect(bedsSection.first()).toBeVisible();
  });

  test('should display admissions section', async ({ adminPage: page }) => {
    await page.goto('/ward-management');
    await page.waitForLoadState('networkidle');
    const admissionsSection = page.locator('text=/admission/i');
    await expect(admissionsSection.first()).toBeVisible();
  });

  test('nurse should access ward management', async ({ nursePage: page }) => {
    await page.goto('/ward-management');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('should display wards overview', async ({ adminPage: page }) => {
    await page.goto('/wards');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/ward/i').first()).toBeVisible();
  });
});
