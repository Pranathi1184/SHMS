const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Enterprise Operations Module', () => {
  test('should display enterprise ops page', async ({ adminPage: page }) => {
    await page.goto('/enterprise-ops');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Create Claim' })).toBeVisible();
  });

  test('should have create claim form', async ({ adminPage: page }) => {
    await page.goto('/enterprise-ops');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Create Claim' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Claim' })).toBeVisible();
  });

  test('should have claims queue section', async ({ adminPage: page }) => {
    await page.goto('/enterprise-ops');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Claims Queue' })).toBeVisible();
  });

  test('billing staff should access enterprise ops', async ({ billingPage: page }) => {
    await page.goto('/enterprise-ops');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Create Claim' })).toBeVisible();
  });

  test('patient should not access enterprise ops', async ({ patientPage: page }) => {
    await page.goto('/enterprise-ops');
    await page.waitForTimeout(2000);
    const url = page.url();
    const content = await page.content();
    const isRestricted = url.includes('unauthorized') || url.includes('dashboard') || content.includes('Unauthorized');
    expect(isRestricted).toBeTruthy();
  });
});
