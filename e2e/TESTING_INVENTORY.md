# SHMS Frontend Testing Inventory

## Public Routes (No Auth Required)

| Route | Page | Components |
|-------|------|------------|
| `/` | Landing Page | Hero section, feature cards (4), "Login to Dashboard" button, "Create Patient Account" button |
| `/login` | Login Page | Email input, Password input, Sign In button, Demo credential buttons (8), "New Patient? Create Account" link |
| `/register` | Register Page | Patient registration form |
| `/unauthorized` | Unauthorized Page | Error message, navigation link |
| `/*` | 404 Not Found | Error message |

## Authenticated Routes (All Roles)

| Route | Page | Allowed Roles |
|-------|------|---------------|
| `/dashboard` | Dashboard | All authenticated users |
| `/ai-center` | AI Center | All roles |

## Role-Specific Routes

### Administrator Only
| Route | Page |
|-------|------|
| `/departments` | Departments Management |
| `/predictions` | Predictions Dashboard |
| `/admin` | Admin Panel (User Management) |

### Clinical Staff (Admin, Doctor, Nurse, Receptionist)
| Route | Page |
|-------|------|
| `/patients` | Patients List |
| `/patients/add` | Add Patient |
| `/patients/:id` | View Patient |
| `/patients/:id/edit` | Edit Patient |
| `/ward-management` | Ward Management |
| `/wards` | Wards Overview |

### Appointments (All Roles)
| Route | Page |
|-------|------|
| `/appointments` | Appointments List |
| `/appointments/:id` | Appointment Details |

### Medical Records
| Route | Page | Roles |
|-------|------|-------|
| `/ehr` | EHR (Create/Edit) | Admin, Doctor, Lab Tech, Pharmacist, Nurse |
| `/ehr-list` | EHR Registry | Admin, Doctor, Nurse, Lab Tech, Pharmacist |

### Laboratory
| Route | Page | Roles |
|-------|------|-------|
| `/laboratory` | Laboratory | Admin, Doctor, Nurse, Receptionist, Lab Tech, Pharmacist |

### Pharmacy & Prescriptions
| Route | Page | Roles |
|-------|------|-------|
| `/pharmacy` | Pharmacy | Admin, Doctor, Nurse, Receptionist, Lab Tech, Pharmacist, Billing Staff |
| `/prescriptions` | Prescriptions | All roles |

### Financial
| Route | Page | Roles |
|-------|------|-------|
| `/insurance` | Insurance | Admin, Doctor, Nurse, Receptionist, Billing Staff |
| `/billing` | Billing | Admin, Doctor, Nurse, Receptionist, Billing Staff |

### Enterprise & Analytics
| Route | Page | Roles |
|-------|------|-------|
| `/enterprise-ops` | Enterprise Operations | Admin, Doctor, Nurse, Receptionist, Billing Staff |
| `/doctors` | Doctors List | Admin, Doctor, Receptionist, Nurse, Patient |

### Predictions (Role-Specific)
| Route | Page | Roles |
|-------|------|-------|
| `/predictions/no-show` | No-Show Predictions | Admin, Receptionist, Doctor |
| `/predictions/doctor-workload` | Doctor Workload | Admin, Doctor |
| `/predictions/medicine-demand` | Medicine Demand | Admin, Pharmacist |
| `/predictions/bed-occupancy` | Bed Occupancy | Admin, Nurse |
| `/predictions/billing-risk` | Billing Risk | Admin, Billing Staff |

### Patient Only
| Route | Page |
|-------|------|
| `/patient-profile` | Patient Profile |

---

## Sidebar Navigation Per Role

### Administrator (17 items)
Dashboard, Patients, Appointments, Doctors, Departments, EHR, EHR Registry, Laboratory, Pharmacy, Prescriptions, Insurance, Billing, Enterprise Ops, AI Center, Predictions, Ward Management, Wards Overview, Admin

### Doctor (14 items)
Dashboard, Patients, Appointments, Doctors, EHR, EHR Registry, Laboratory, Prescriptions, Enterprise Ops, AI Center, No-Show Predictions, Workload Forecast, Ward Management, Wards Overview

### Nurse (13 items)
Dashboard, Patients, Appointments, Doctors, EHR, EHR Registry, Laboratory, Pharmacy, Enterprise Ops, AI Center, Bed Occupancy, Ward Management, Wards Overview

### Receptionist (12 items)
Dashboard, Patients, Appointments, Doctors, Pharmacy, Insurance, Billing, Enterprise Ops, AI Center, No-Show Predictions, Ward Management, Wards Overview

### Lab Technician (4 items)
Dashboard, Laboratory, EHR Registry, AI Center

### Pharmacist (6 items)
Dashboard, EHR Registry, Pharmacy, Prescriptions, AI Center, Medicine Demand

### Billing Staff (7 items)
Dashboard, Patients, Insurance, Billing, Enterprise Ops, AI Center, Billing Risk

### Patient (6 items)
Dashboard, My Profile, My Appointments, My Prescriptions, Doctors, AI Center

---

## Global Components (Present on All Authenticated Pages)

| Component | Type | Description |
|-----------|------|-------------|
| Sidebar | Navigation Drawer | Role-based menu items, user avatar, SHMS logo |
| TopNav | Header | Title, Command Palette button (Ctrl+K), Recently Viewed button, Notifications bell (with badge), User avatar menu |
| Command Palette | Modal/Dialog | Quick navigation search (Ctrl+K hotkey) |
| AI Floating Assistant | FAB + Drawer | Floating action button (bottom-right), opens chat drawer |
| Notification Panel | Popover/Drawer | Shows unread notifications, mark-all-read |
| Quick Tour Dialog | Modal | Role-specific tips shown on first login |
| Confirm Dialog | Dialog | Reusable confirmation for destructive actions |
| Toast Notifications | Snackbar | Success/error feedback on operations |
| TableSkeletonLoader | Loading State | Skeleton placeholder for tables |
| EmptyState | Component | "No data" placeholder with icon |

---

## Page-by-Page Component Inventory

### 1. Dashboard (`/dashboard`)
**Cards (5):** Revenue (Filtered), Total Patients, Departments, Low Stock Medicines, Occupancy Rate
**Filters:** Date range (From/To), Apply Filters button, Reset button
**Tables:** Capacity Heatmap (Department, Doctor, Time Block, Utilization)
**Charts (bar charts):** Revenue by Day, Patients by Gender, Department Workload, Occupancy by Bed Status
**Reports/Export:** Inventory Report (CSV/PDF), Revenue Report (CSV/PDF), Patient Report (CSV/PDF), Department Report (CSV/PDF), Occupancy Report (CSV/PDF)
**AI Section:** Auto Recommendations (text-based suggestions)
**Role-specific sections:** Quick actions (Upcoming Appointments, Pending Prescriptions, Pending Bills for clinical staff)

### 2. Patients List (`/patients`)
**Search:** Text search field
**Filters:** Status filter (Active/Inactive)
**Table:** Patient list with columns (Name, Email, Phone, DOB, Gender, Blood Group, Actions)
**Pagination:** Page navigation
**Buttons:** Add Patient
**Actions per row:** View, Edit, Delete
**Dialog:** Delete confirmation

### 3. Add Patient (`/patients/add`)
**Form fields:** First Name, Last Name, Email, Phone, DOB, Gender (dropdown), Blood Group (dropdown), Address, Emergency Contact Name, Emergency Contact Phone
**Buttons:** Submit, Cancel/Back

### 4. View Patient (`/patients/:id`)
**Display sections:** Patient details, Medical history summary
**Buttons:** Edit, Back
**Links:** Related appointments, prescriptions, lab results

### 5. Edit Patient (`/patients/:id/edit`)
**Form:** Same fields as Add Patient, pre-populated
**Buttons:** Save, Cancel

### 6. Appointments List (`/appointments`)
**Search:** Text search
**Filters:** Status dropdown (Scheduled, Completed, Cancelled, No-Show)
**Table:** Appointments list (Patient, Doctor, Date, Time, Status, Actions)
**Pagination:** Page navigation
**Dialogs:** 
- Add/Edit Appointment dialog (Patient autocomplete, Doctor autocomplete, Date picker, Time picker, Reason textarea, Status dropdown)
- Cancel appointment dialog
**Buttons:** Add Appointment, Cancel, Edit per row
**Autocompletes:** Patient search, Doctor search

### 7. Appointment Details (`/appointments/:id`)
**Display:** Full appointment details
**Actions:** Edit, Cancel, Complete, Mark No-Show
**Related data:** Patient info, Doctor info

### 8. Doctors List (`/doctors`)
**Search:** Text search
**Filters:** Department filter, Availability filter
**Table:** Doctors list (Name, Specialty, Department, License, Schedule, Availability, Actions)
**Dialogs:**
- Add Doctor dialog (Name, Email, License No, Specialty, Department dropdown, Phone, Qualification, Experience, Consultation Fee, Schedule fields)
- Edit availability dialog
- Clinic mode toggle dialog
**Buttons:** Add Doctor, Toggle Availability, Toggle Clinic Mode per row

### 9. Departments (`/departments`)
**Table:** Departments list (Name, Description, Head, Location, Status, Actions)
**Dialogs:**
- Add/Edit Department dialog (Name, Description, Head, Location, Phone, Email, Status dropdown)
- Delete confirmation
**Buttons:** Add Department, Edit, Delete per row

### 10. EHR (`/ehr`)
**Form:** Create/Edit EHR record
**Fields:** Patient (autocomplete), Diagnosis, Treatment Plan, Medications, Notes, Attachments
**Buttons:** Save, Cancel

### 11. EHR Registry (`/ehr-list`)
**Search:** Text search
**Table:** EHR records list (Patient, Doctor, Diagnosis, Date, Actions)
**Pagination:** Page navigation
**Actions:** View, Edit, Delete
**Dialog:** Delete confirmation

### 12. Laboratory (`/laboratory`)
**Search:** Text search
**Filters:** Status filter (Pending, Completed, In Progress)
**Table:** Lab tests list (Patient, Test Type, Doctor, Status, Date, Results, Actions)
**Dialogs:**
- Create lab test dialog (Patient, Test Type, Doctor, Priority, Notes)
- Update results dialog (Results, Status, Notes)
- Generate report dialog
**Buttons:** Create Lab Test, Update, Generate Report, Delete

### 13. Pharmacy (`/pharmacy`)
**Search:** Medicine search
**Filters:** Category, Stock status
**Table:** Medicines list (Name, Category, Stock, Price, Expiry, Manufacturer, Actions)
**Dialogs:**
- Add/Edit Medicine dialog (Name, Category, Generic Name, Manufacturer, Price, Stock, Reorder Level, Expiry Date, Description)
- Pharmacy Sale dialog (Medicine, Quantity, Patient)
- Delete confirmation
**Buttons:** Add Medicine, Record Sale, Edit, Delete per row

### 14. Prescriptions (`/prescriptions`)
**Search:** Text search
**Filters:** Status filter (Pending, Dispensed, Cancelled)
**Table:** Prescriptions list (Patient, Doctor, Medicines, Status, Date, Actions)
**Dialogs:**
- Create prescription dialog (Patient autocomplete, Doctor, Medicines multi-select, Dosage, Duration, Notes)
- Edit prescription dialog
- Dispense dialog
- Delete confirmation
**Buttons:** Create Prescription, Dispense, Edit, Delete per row

### 15. Insurance (`/insurance`)
**Search:** Text search
**Table:** Insurance records (Patient, Provider, Policy No, Coverage, Expiry, Status, Actions)
**Dialogs:**
- Add/Edit Insurance dialog (Patient autocomplete, Provider, Policy Number, Coverage Type, Coverage Amount, Premium, Start Date, End Date, Status)
- Delete confirmation
**Buttons:** Add Insurance, Edit, Delete per row

### 16. Billing (`/billing`)
**Search:** Text search
**Table:** Bills list (Patient, Amount, Status, Date, Description, Actions)
**Dialogs:**
- Create/Edit Bill dialog (Patient autocomplete, Amount, Description, Status dropdown, Payment Method, Discount, Tax, Notes)
- View Bill dialog (read-only details)
- Delete confirmation
**Buttons:** Create Bill, Edit, View, Delete per row

### 17. Enterprise Ops (`/enterprise-ops`)
**Tabs/Sections:**
- Notifications management
- Activity logs
- Data quality checks
- Audit trails
**Tables:** Activity logs, Notifications
**Buttons:** Run data quality check, Clear notifications
**Filters:** Date range, Event type

### 18. AI Center (`/ai-center`)
**Chat interface:** Message input, Send button, Chat history
**Features:** AI assistant for medical queries, scheduling help, billing questions
**Buttons:** Send, Clear chat, Quick action buttons
**Display:** Chat messages (user + AI), Loading indicator

### 19. Predictions Dashboard (`/predictions`)
**Cards:** Links to sub-prediction pages
**Charts:** Overview metrics

### 20. No-Show Predictions (`/predictions/no-show`)
**Table:** Predicted no-shows (Patient, Appointment, Probability, Risk Level)
**Charts:** No-show trends, Risk distribution
**Filters:** Date range, Department

### 21. Doctor Workload (`/predictions/doctor-workload`)
**Charts:** Workload distribution, Capacity planning
**Table:** Doctor workload metrics
**Filters:** Department, Time period

### 22. Medicine Demand (`/predictions/medicine-demand`)
**Charts:** Demand forecasting curves
**Table:** Predicted medicine demand
**Filters:** Category, Time period

### 23. Bed Occupancy (`/predictions/bed-occupancy`)
**Charts:** Occupancy trends, Capacity planning
**Table:** Ward occupancy predictions
**Filters:** Ward, Time period

### 24. Billing Risk (`/predictions/billing-risk`)
**Charts:** Revenue risk assessment
**Table:** High-risk billing accounts
**Filters:** Risk level, Amount range

### 25. Ward Management (`/ward-management`)
**Tabs/Sections:** Wards, Beds, Admissions
**Tables:** 
- Wards list (Name, Department, Capacity, Status)
- Beds list (Number, Ward, Status, Patient)
- Admissions list (Patient, Ward, Bed, Admission Date, Discharge Date, Status)
**Dialogs:**
- Create/Edit Ward dialog
- Create/Edit Bed dialog
- Create Admission dialog
- Discharge dialog
**Buttons:** Add Ward, Add Bed, Admit Patient, Discharge, Edit, Delete per section

### 26. Wards Overview (`/wards`)
**Display:** Visual ward/bed overview
**Status indicators:** Available, Occupied, Maintenance

### 27. Admin Panel (`/admin`)
**Quick action cards:** Links to manage users, doctors, departments, reports
**No CRUD directly** — navigation hub to other admin pages

### 28. Patient Profile (`/patient-profile`)
**Display sections:** Personal info, Appointments, Prescriptions, Bills, Lab Results
**Buttons:** Edit profile (limited fields)

---

## API Endpoints Inventory

### Auth (`/api/auth`)
- POST `/register` - Register new user
- POST `/login` - Login
- POST `/refresh-token` - Refresh JWT
- GET `/me` - Get current user
- POST `/logout` - Logout (blacklist token)

### Patients (`/api/patients`)
- POST `/` - Create patient
- GET `/` - List patients (search, pagination)
- GET `/me` - Get my profile (Patient role)
- GET `/:id` - Get patient by ID
- PUT `/:id` - Update patient
- POST `/:id/documents` - Upload document
- GET `/:id/documents` - Get documents
- DELETE `/:id` - Delete patient

### Appointments (`/api/appointments`)
- GET `/availability` - Check availability
- GET `/available-doctors` - Get available doctors
- GET `/slot-finder` - Find best slots
- GET `/pre-visit-readiness` - Pre-visit readiness check
- POST `/` - Create appointment
- GET `/` - List appointments
- GET `/:id` - Get by ID
- PUT `/:id` - Update appointment
- PUT `/:id/cancel` - Cancel appointment

### Doctors (`/api/doctors`)
- GET `/` - List doctors
- POST `/` - Create doctor
- PUT `/:id/availability` - Update availability
- PUT `/:id/clinic-mode` - Toggle clinic mode

### Departments (`/api/departments`)
- CRUD: POST `/`, GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`

### EHR (`/api/ehr`)
- CRUD: POST `/`, GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`

### Laboratory (`/api/laboratory-tests`)
- POST `/` - Create lab test
- GET `/` - List lab tests
- GET `/:id/report` - Generate report
- GET `/:id` - Get by ID
- PUT `/:id` - Update lab test
- DELETE `/:id` - Delete lab test

### Medicines (`/api/medicines`)
- POST `/` - Create medicine
- POST `/sales` - Create pharmacy sale
- GET `/` - List medicines
- GET `/:id` - Get by ID
- PUT `/:id` - Update medicine
- DELETE `/:id` - Delete medicine

### Prescriptions (`/api/prescriptions`)
- POST `/` - Create prescription
- GET `/` - List prescriptions
- GET `/:id` - Get by ID
- PUT `/:id` - Update prescription
- PUT `/:id/dispense` - Dispense prescription
- DELETE `/:id` - Delete prescription

### Insurance (`/api/insurance`)
- CRUD: POST `/`, GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`

### Bills (`/api/bills`)
- CRUD: POST `/`, GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`

### Notifications (`/api/notifications`)
- GET `/` - Get my notifications
- PATCH `/read-all` - Mark all read
- PATCH `/:id/read` - Mark one read

### Ward Management (`/api/ward-management`)
- Wards: POST `/wards`, GET `/wards`, GET `/wards/:id`, PUT `/wards/:id`, DELETE `/wards/:id`
- Beds: POST `/beds`, GET `/beds`, GET `/beds/:id`, PUT `/beds/:id`, DELETE `/beds/:id`
- Admissions: POST `/admissions`, GET `/admissions`, GET `/admissions/:id`, PUT `/admissions/:id`, PUT `/admissions/:id/discharge`, DELETE `/admissions/:id`

### Reports (`/api/reports`)
- GET endpoints for various report types with CSV export support

### Analytics (`/api/analytics`)
- GET endpoints for dashboard metrics, trends

### Predictions (`/api/predictions`)
- GET endpoints for no-show, workload, demand, occupancy, billing-risk

### AI (`/api/ai`)
- POST/GET endpoints for AI chat and recommendations

### Agents (`/api/agents`)
- POST/GET endpoints for AI agent orchestration

### Enterprise (`/api/enterprise`)
- POST/GET/PATCH endpoints for enterprise operations

### Activity Logs (`/api/activity-logs`)
- GET `/` - Get activity logs (Admin only)

---

## Interactive Elements Summary

| Element Type | Count | Pages |
|--------------|-------|-------|
| CRUD Dialogs | 12+ | Patients, Appointments, Doctors, Departments, EHR, Lab, Pharmacy, Prescriptions, Insurance, Billing, Ward Management |
| Search Inputs | 10+ | Patients, Appointments, Doctors, Lab, Pharmacy, Prescriptions, Insurance, Billing |
| Filter Dropdowns | 8+ | Appointments, Lab, Pharmacy, Prescriptions, Dashboard |
| Autocompletes | 5+ | Appointments (Patient, Doctor), Prescriptions, Bills, Insurance |
| Data Tables | 15+ | All list pages |
| Pagination | 8+ | Patients, Appointments, EHR, Lab, Pharmacy, Prescriptions |
| Bar Charts | 5 | Dashboard (Revenue, Gender, Workload, Occupancy, Inventory) |
| Export Buttons | 10+ | Dashboard (CSV/PDF for each report section) |
| Date Pickers | 5+ | Dashboard filters, Appointment forms, Insurance dates |
| FAB (AI Assistant) | 1 | All authenticated pages |
| Command Palette | 1 | All authenticated pages (Ctrl+K) |

---

## Test Users

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@shms.com | admin123 |
| Doctor | doctor@shms.com | password123 |
| Nurse | nurse@shms.com | password123 |
| Receptionist | reception@shms.com | password123 |
| Lab Technician | lab@shms.com | password123 |
| Pharmacist | pharmacy@shms.com | password123 |
| Billing Staff | billing@shms.com | password123 |
| Patient | ananya.iyer.patient@shms.com | patient123 |

---

## Hidden/Conditional Features

1. **Quick Tour Dialog** - Only shows on first login per role
2. **Command Palette** - Only accessible via Ctrl+K hotkey
3. **Notification Badge** - Only shows when unread notifications exist
4. **Recently Viewed** - Only shows items after navigation
5. **Export buttons** - Only visible when report data is available
6. **Auto Recommendations** - Only shows on Dashboard when capacity data exists
7. **Patient-specific views** - Appointments/Prescriptions filtered to own data
8. **Doctor-specific views** - Appointments filtered to assigned patients
