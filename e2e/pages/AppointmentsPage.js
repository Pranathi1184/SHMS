class AppointmentsPage {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    this.statusFilter = page.locator('select, [role="button"]:has-text("Status"), .MuiSelect-select');
    this.addAppointmentBtn = page.locator('button:has-text("Add Appointment"), button:has-text("Book"), button:has-text("New")');
    this.table = page.locator('table');
    this.tableRows = page.locator('table tbody tr');
    this.pagination = page.locator('.MuiPagination-root');
    this.dialog = page.locator('[role="dialog"]');
  }

  async goto() {
    await this.page.goto('/appointments');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async openAddDialog() {
    await this.addAppointmentBtn.click();
    await this.dialog.waitFor();
  }

  async getRowCount() {
    return await this.tableRows.count();
  }
}

module.exports = { AppointmentsPage };
