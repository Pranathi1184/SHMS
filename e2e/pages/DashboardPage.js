class DashboardPage {
  constructor(page) {
    this.page = page;
    this.welcomeText = page.locator('h4:has-text("Welcome back")');
    this.reportFilters = page.locator('text=Report Filters');
    this.fromDate = page.locator('label:has-text("From") + div input, input[type="date"]').first();
    this.toDate = page.locator('input[type="date"]').nth(1);
    this.applyFiltersBtn = page.locator('button:has-text("Apply Filters")');
    this.resetBtn = page.locator('button:has-text("Reset")');
    this.revenueCard = page.locator('text=Revenue (Filtered)');
    this.patientsCard = page.locator('text=Total Patients');
    this.departmentsCard = page.locator('text=Departments');
    this.lowStockCard = page.locator('text=Low Stock Medicines');
    this.occupancyCard = page.locator('text=Occupancy Rate');
    this.heatmapTable = page.locator('text=Capacity Heatmap');
    this.exportCSVButtons = page.locator('button:has-text("Export CSV"), button:has-text("CSV")');
    this.exportPDFButtons = page.locator('button:has-text("Export PDF"), button:has-text("PDF")');
    this.sidebar = page.locator('nav');
  }

  async isLoaded() {
    await this.welcomeText.waitFor({ timeout: 10000 });
  }

  async getStatCards() {
    return {
      revenue: await this.page.locator('h4').filter({ hasText: /\$/ }).textContent(),
      patients: await this.page.locator('h4').filter({ hasText: /^\d+$/ }).first().textContent(),
    };
  }

  async navigateTo(menuItem) {
    await this.page.locator(`nav >> text=${menuItem}`).click();
  }
}

module.exports = { DashboardPage };
