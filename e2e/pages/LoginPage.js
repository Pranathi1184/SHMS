class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.signInButton = page.locator('button[type="submit"]');
    this.createAccountLink = page.locator('a:has-text("Create Account")');
    this.demoButtons = {
      admin: page.locator('button:has-text("Use Admin Demo")'),
      doctor: page.locator('button:has-text("Use Doctor Demo")'),
      nurse: page.locator('button:has-text("Use Nurse Demo")'),
      reception: page.locator('button:has-text("Use Reception Demo")'),
      lab: page.locator('button:has-text("Use Lab Demo")'),
      pharmacy: page.locator('button:has-text("Use Pharmacy Demo")'),
      billing: page.locator('button:has-text("Use Billing Demo")'),
      patient: page.locator('button:has-text("Use Patient Demo")'),
    };
  }

  async goto() {
    await this.page.goto('/login');
    await this.emailInput.waitFor();
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async useDemoLogin(role) {
    await this.demoButtons[role].click();
  }
}

module.exports = { LoginPage };
