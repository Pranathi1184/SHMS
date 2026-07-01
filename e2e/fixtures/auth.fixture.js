const base = require('@playwright/test');
const { expect } = base;

const USERS = {
  admin: { email: 'admin@shms.com', password: 'admin123', role: 'Administrator' },
  doctor: { email: 'doctor@shms.com', password: 'password123', role: 'Doctor' },
  nurse: { email: 'nurse@shms.com', password: 'password123', role: 'Nurse' },
  receptionist: { email: 'reception@shms.com', password: 'password123', role: 'Receptionist' },
  labTech: { email: 'lab@shms.com', password: 'password123', role: 'Lab Technician' },
  pharmacist: { email: 'pharmacy@shms.com', password: 'password123', role: 'Pharmacist' },
  billing: { email: 'billing@shms.com', password: 'password123', role: 'Billing Staff' },
  patient: { email: 'ananya.iyer.patient@shms.com', password: 'patient123', role: 'Patient' },
};

async function loginAs(page, role) {
  const user = USERS[role];
  if (!user) throw new Error(`Unknown role: ${role}`);

  await page.goto('/login');
  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  // Dismiss quick tour dialog if present (may take a moment to appear)
  await page.waitForTimeout(500);
  const gotIt = page.locator('button:has-text("Got it")');
  try {
    await gotIt.waitFor({ state: 'visible', timeout: 2000 });
    await gotIt.click();
    await page.waitForTimeout(300);
  } catch (e) {
    // No tour dialog - that's fine
  }
  // Also dismiss any other dialog that might be showing
  const dialogBackdrop = page.locator('.MuiDialog-root');
  if (await dialogBackdrop.isVisible().catch(() => false)) {
    const closeBtn = dialogBackdrop.locator('button').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  }
}

const test = base.test.extend({
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'admin');
    await use(page);
  },
  doctorPage: async ({ page }, use) => {
    await loginAs(page, 'doctor');
    await use(page);
  },
  nursePage: async ({ page }, use) => {
    await loginAs(page, 'nurse');
    await use(page);
  },
  receptionistPage: async ({ page }, use) => {
    await loginAs(page, 'receptionist');
    await use(page);
  },
  labTechPage: async ({ page }, use) => {
    await loginAs(page, 'labTech');
    await use(page);
  },
  pharmacistPage: async ({ page }, use) => {
    await loginAs(page, 'pharmacist');
    await use(page);
  },
  billingPage: async ({ page }, use) => {
    await loginAs(page, 'billing');
    await use(page);
  },
  patientPage: async ({ page }, use) => {
    await loginAs(page, 'patient');
    await use(page);
  },
});

module.exports = { test, expect, USERS, loginAs };
