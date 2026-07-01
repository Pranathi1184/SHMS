const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Predictions Module', () => {
  test('should display predictions dashboard for admin', async ({ adminPage: page }) => {
    await page.goto('/predictions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/prediction/i').first()).toBeVisible();
  });

  test('should display no-show predictions', async ({ adminPage: page }) => {
    await page.goto('/predictions/no-show');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/no.show|prediction/i').first()).toBeVisible();
  });

  test('should display doctor workload', async ({ adminPage: page }) => {
    await page.goto('/predictions/doctor-workload');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/workload|doctor/i').first()).toBeVisible();
  });

  test('should display medicine demand', async ({ adminPage: page }) => {
    await page.goto('/predictions/medicine-demand');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/medicine|demand/i').first()).toBeVisible();
  });

  test('should display bed occupancy', async ({ adminPage: page }) => {
    await page.goto('/predictions/bed-occupancy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/bed|occupancy/i').first()).toBeVisible();
  });

  test('should display billing risk', async ({ adminPage: page }) => {
    await page.goto('/predictions/billing-risk');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/billing|risk/i').first()).toBeVisible();
  });

  test('pharmacist should access medicine demand only', async ({ pharmacistPage: page }) => {
    await page.goto('/predictions/medicine-demand');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/medicine|demand/i').first()).toBeVisible();
  });

  test('nurse should access bed occupancy only', async ({ nursePage: page }) => {
    await page.goto('/predictions/bed-occupancy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/bed|occupancy/i').first()).toBeVisible();
  });

  test('billing staff should access billing risk only', async ({ billingPage: page }) => {
    await page.goto('/predictions/billing-risk');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/billing|risk/i').first()).toBeVisible();
  });
});
