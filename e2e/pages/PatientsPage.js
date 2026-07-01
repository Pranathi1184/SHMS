class PatientsPage {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    this.addPatientBtn = page.locator('button:has-text("Add Patient"), a:has-text("Add Patient")');
    this.table = page.locator('table');
    this.tableRows = page.locator('table tbody tr');
    this.pagination = page.locator('nav[aria-label="pagination"], .MuiPagination-root');
    this.deleteDialog = page.locator('[role="dialog"]');
    this.confirmDeleteBtn = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")');
    this.cancelBtn = page.locator('[role="dialog"] button:has-text("Cancel")');
  }

  async goto() {
    await this.page.goto('/patients');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async getRowCount() {
    return await this.tableRows.count();
  }

  async clickAddPatient() {
    await this.addPatientBtn.click();
  }

  async deleteFirstPatient() {
    const deleteBtn = this.page.locator('button[aria-label*="delete"], button:has-text("Delete")').first();
    await deleteBtn.click();
  }
}

module.exports = { PatientsPage };
