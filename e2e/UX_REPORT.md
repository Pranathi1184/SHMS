# UX Evaluation Report — SHMS

## Summary
Evaluated as a first-time user across all 8 roles. Overall the app is functional and navigable, but has several UX friction points.

---

## Issues Ranked by Severity

### Critical (Blocks Workflow)

| # | Issue | Page | Role | Description |
|---|-------|------|------|-------------|
| 1 | No confirmation on destructive actions | Departments, Patients | Admin | Delete buttons trigger immediately without "Are you sure?" confirmation. Data loss risk. |
| 2 | Quick Tour dialog blocks interaction | All pages (first login) | All | After login, a modal tour dialog appears that must be dismissed before any interaction. If not dismissed, button clicks land on the overlay. |

### High (Significant Friction)

| # | Issue | Page | Role | Description |
|---|-------|------|------|-------------|
| 3 | Multi-step Add Patient wizard has no save progress | /patients/add | Admin, Receptionist | If browser refreshes during step 2 or 3, all entered data is lost. No draft/autosave. |
| 4 | No search on Pharmacy or Prescriptions pages | /pharmacy, /prescriptions | All | Unlike Patients and Appointments which have search bars, Pharmacy and Prescriptions have no way to search/filter — must scroll through entire tables. |
| 5 | Heatmap table shows too many rows without pagination | /dashboard | Admin | Capacity Heatmap shows 30-min blocks for every doctor. With 10+ doctors, the table is extremely long (100+ rows) and overwhelms the page. |
| 6 | Sidebar has no visual section grouping | All | All | 18+ sidebar items listed flat without categories (Clinical, Admin, Analytics). Hard to find what you need. |
| 7 | Lab Tech cannot order tests | /laboratory | Lab Tech | Despite being the primary lab role, Lab Techs cannot create test orders — only Admin/Doctor can. Counter-intuitive. |

### Medium (Noticeable Friction)

| # | Issue | Page | Role | Description |
|---|-------|------|------|-------------|
| 8 | "Enterprise Ops" naming is unclear | Sidebar | All | "Enterprise Ops" doesn't clearly communicate it's about insurance claims. Expected "Insurance Claims" or "Claims Management". |
| 9 | Demo credentials shown on login page | /login | N/A | Showing plain-text credentials is fine for development but must be removed in production. |
| 10 | No loading skeleton/spinner on data pages | All tables | All | Tables appear blank for 1-2s while API loads, then suddenly fill. No loading indicator. |
| 11 | Date filters require manual format entry | /dashboard | Admin | Date inputs show "mm/dd/yyyy" format with no datepicker hint. Users may not know they can click the calendar icon. |
| 12 | No breadcrumbs for deep navigation | /patients/add, /appointments/:id | All | Once deep in a workflow, there's no breadcrumb trail. Only the back button helps. |
| 13 | Notifications badge shows count but no dropdown list | Header | All | Bell icon shows "1" but clicking it might not show a full notification center. Unclear what notifications exist. |
| 14 | Patient role can't view own billing history | /billing | Patient | Patients are restricted from billing page. They should be able to view their own bills (read-only). |

### Low (Minor Annoyance)

| # | Issue | Page | Role | Description |
|---|-------|------|------|-------------|
| 15 | Inconsistent button labels across modules | Various | All | Some use "Add Department", others "Book Appointment", others "Order Test", others "Create Claim". No consistent verb pattern. |
| 16 | Status chips lack color coding consistency | /appointments, /laboratory | All | Some statuses are colored (green/red), others are plain text. Inconsistent visual language. |
| 17 | Charts section requires scrolling to see | /dashboard | Admin | Charts for Revenue, Gender, Workload, Occupancy are below the fold. No anchor links or tabs to jump to them. |
| 18 | No dark mode toggle | All | All | No theme switcher despite being a common expectation in modern apps. |
| 19 | "EHR" and "EHR Registry" listed separately | Sidebar | All | Unclear what differentiates EHR from EHR Registry for a new user. |
| 20 | Floating AI button overlaps table content | All pages | All | The green floating action button (AI assistant) sometimes overlaps the last row of tables on small screens. |

---

## Workflow Observations

### Positive
- Login with demo buttons is extremely convenient for development
- Sidebar navigation is fast and responsive
- Dashboard stat cards give immediate overview of system state
- Command Palette (Ctrl+K) is a powerful feature for power users
- Role-based access is enforced correctly — restricted pages redirect properly

### Needs Improvement
- **Appointment booking**: Takes 4+ fields to fill (patient, doctor, date, time, reason). Would benefit from smart defaults (e.g., auto-suggest next available slot)
- **Patient search then action**: To book an appointment for a patient, you must switch between Patients page and Appointments page. No direct "Book for this patient" button on patient row.
- **No keyboard shortcuts for common actions**: Only Ctrl+K exists. No Ctrl+N for new, Ctrl+S for save, etc.
- **No undo/redo for destructive actions**: Delete is permanent. No soft-undo toast like Gmail.

---

## Recommendations (Prioritized)

1. Add confirmation dialogs for all delete actions
2. Add search/filter to Pharmacy and Prescriptions pages  
3. Group sidebar items into collapsible sections
4. Rename "Enterprise Ops" to "Claims Management"
5. Add loading skeletons for tables
6. Add breadcrumbs to deep pages
7. Paginate or collapse the heatmap table
8. Allow Lab Tech to order tests
9. Let patients view their own billing (read-only)
10. Add autosave/draft for multi-step forms
