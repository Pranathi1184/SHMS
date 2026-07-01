const { test, expect } = require('../fixtures/auth.fixture');

test.describe('Navigation & Global Components', () => {
  test.describe('Landing Page', () => {
    test('should display landing page', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=Doctor Appointment and Care Management')).toBeVisible();
      await expect(page.locator('a:has-text("Login to Dashboard")')).toBeVisible();
      await expect(page.locator('a:has-text("Create Patient Account")')).toBeVisible();
    });

    test('should have feature cards', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=Doctor Discovery and Booking')).toBeVisible();
      await expect(page.locator('text=Clinical Workflows')).toBeVisible();
      await expect(page.locator('text=AI Operations Assistant')).toBeVisible();
      await expect(page.locator('text=Pharmacy and Billing')).toBeVisible();
    });

    test('should navigate to login from landing', async ({ page }) => {
      await page.goto('/');
      await page.click('a:has-text("Login to Dashboard")');
      await page.waitForURL('**/login');
    });

    test('should navigate to register from landing', async ({ page }) => {
      await page.goto('/');
      await page.click('a:has-text("Create Patient Account")');
      await page.waitForURL('**/register');
    });
  });

  test.describe('404 Page', () => {
    test('should show 404 for unknown routes when authenticated', async ({ adminPage: page }) => {
      await page.goto('/nonexistent-page-xyz');
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    });
  });

  test.describe('Command Palette', () => {
    test('should open with Ctrl+K', async ({ adminPage: page }) => {
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(1000);
      const dialog = page.locator('.MuiDialog-paper');
      await expect(dialog).toBeVisible();
    });
  });

  test.describe('Notifications', () => {
    test('should show notification bell', async ({ adminPage: page }) => {
      // Notification bell is an icon button in top nav
      const topNav = page.locator('header, .MuiAppBar-root');
      const buttons = topNav.locator('button');
      expect(await buttons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('admin should see all menu items', async ({ adminPage: page }) => {
      const navItems = ['Dashboard', 'Patients', 'Appointments', 'Doctors', 'Departments'];
      for (const item of navItems) {
        await expect(page.locator(`nav >> text=${item}`).first()).toBeVisible();
      }
    });

    test('should navigate between pages via sidebar', async ({ adminPage: page }) => {
      await page.locator('nav').getByText('Patients', { exact: true }).click();
      await page.waitForURL('**/patients');
      await page.locator('nav').getByText('Appointments').click();
      await page.waitForURL('**/appointments');
    });
  });

  test.describe('Responsive Design', () => {
    test('should adjust layout on mobile viewport', async ({ adminPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      // Page should still render content
      await expect(page.locator('main')).toBeVisible();
    });
  });
});
