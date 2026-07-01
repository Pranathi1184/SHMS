const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form with all elements', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.signInButton).toBeVisible();
      await expect(loginPage.createAccountLink).toBeVisible();
      await expect(page.locator('h1:has-text("SHMS Login")')).toBeVisible();
    });

    test('should show all 8 demo login buttons', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      for (const btn of Object.values(loginPage.demoButtons)) {
        await expect(btn).toBeVisible();
      }
    });

    test('should show validation on empty submit', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.signInButton.click();
      // HTML5 validation should prevent submission
      const emailInput = await loginPage.emailInput;
      const validity = await emailInput.evaluate(el => el.validity.valid);
      expect(validity).toBe(false);
    });

    test('should show error on invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('invalid@test.com', 'wrongpassword');
      await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
    });

    test('should login successfully as admin', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('admin@shms.com', 'admin123');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page.locator('text=Welcome back')).toBeVisible();
    });

    test('should login using admin demo button', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.useDemoLogin('admin');
      await loginPage.signInButton.click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page.locator('text=Welcome back')).toBeVisible();
    });

    test('should login as each role successfully', async ({ page }) => {
      const roles = [
        { email: 'doctor@shms.com', password: 'password123' },
        { email: 'nurse@shms.com', password: 'password123' },
        { email: 'reception@shms.com', password: 'password123' },
        { email: 'lab@shms.com', password: 'password123' },
        { email: 'pharmacy@shms.com', password: 'password123' },
        { email: 'billing@shms.com', password: 'password123' },
        { email: 'ananya.iyer.patient@shms.com', password: 'patient123' },
      ];
      for (const { email, password } of roles) {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(email, password);
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await expect(page.locator('text=Welcome back')).toBeVisible();
        // Dismiss tour if shown
        const gotIt = page.locator('button:has-text("Got it")');
        if (await gotIt.isVisible({ timeout: 1000 }).catch(() => false)) {
          await gotIt.click();
        }
        // Logout by clearing storage and navigating
        await page.evaluate(() => localStorage.clear());
        await page.goto('/login');
      }
    });
  });

  test.describe('Registration', () => {
    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/login');
      await page.click('a:has-text("Create Account")');
      await page.waitForURL('**/register');
      await expect(page.locator('text=/register|create|sign up/i')).toBeVisible();
    });
  });

  test.describe('Access Control', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL('**/login', { timeout: 10000 });
    });

    test('should show unauthorized page for restricted routes', async ({ page }) => {
      // Login as patient
      await page.goto('/login');
      await page.fill('input[name="email"]', 'ananya.iyer.patient@shms.com');
      await page.fill('input[name="password"]', 'patient123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      // Try to access admin-only page
      await page.goto('/departments');
      await expect(page.locator('text=/unauthorized|access denied|not authorized/i')).toBeVisible({ timeout: 5000 });
    });
  });
});
