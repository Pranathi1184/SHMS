# SHMS Seed Data Audit Report

**Date:** 2026-07-01
**Auditor:** Database QA Engineer (automated)
**Scope:** Full 10-step seed data verification and repair

---

## 1. Seed Process Identification

| Component | Location |
|-----------|----------|
| Main seeder | `backend/src/seeders/20260626120000-seed-all.js` (864 lines) |
| Helper functions | `backend/src/seeders/helpers.js` |
| Seed runner | `backend/run-seed.js` |
| Migrations | `backend/src/migrations/` |
| ORM | Sequelize with `db.sync({ force: true })` |

The seed process drops and recreates all tables via `sync({ force: true })`, then runs a single comprehensive seeder that populates all 24 tables in dependency order.

---

## 2. Table Row Counts (Post-Repair)

| Table | Count | Status |
|-------|------:|--------|
| users | 206 | OK |
| departments | 10 | OK |
| doctors | 20 | OK |
| doctor_schedules | 20 | OK |
| patients | 600 | OK |
| appointments | 1600 | OK |
| ehr | 550 | OK |
| medicines | 220 | OK |
| prescriptions | 520 | OK |
| prescription_items | 1305 | OK |
| laboratory_tests | 450 | OK |
| insurance | 434 | OK |
| bills | 500 | OK |
| bill_items | 1497 | OK |
| wards | 20 | OK |
| beds | 165 | OK |
| admissions | 180 | OK |
| notifications | 350 | OK |
| claims | 100 | OK (NEW) |
| no_show_predictions | 200 | OK (NEW) |
| bed_occupancy_forecast | 84 | OK (NEW) |
| doctor_load_forecast | 140 | OK (NEW) |
| medicine_demand_forecast | 180 | OK (NEW) |
| billing_risk_scores | 150 | OK (NEW) |

**Total: 24 tables, all populated with realistic data.**

---

## 3. User Role Distribution

| Role | Count | Login Credential | Status |
|------|------:|------------------|--------|
| Administrator | 5 | admin@shms.com / admin123 | PASS |
| Doctor | 20 | doctor@shms.com / password123 | PASS |
| Nurse | 25 | nurse@shms.com / password123 | PASS |
| Receptionist | 10 | reception@shms.com / password123 | PASS |
| Lab Technician | 10 | lab@shms.com / password123 | PASS |
| Pharmacist | 8 | pharmacy@shms.com / password123 | PASS |
| Billing Staff | 8 | billing@shms.com / password123 | PASS |
| Patient | 120 | ananya.iyer.patient@shms.com / patient123 | PASS |

All 8 roles verified with successful login (200 OK).

---

## 4. Relationship Validation (FK Integrity)

| Relationship | Orphan Count |
|-------------|-------------:|
| appointments -> patients | 0 |
| appointments -> doctors | 0 |
| prescriptions -> patients | 0 |
| bills -> patients | 0 |
| claims -> insurance | 0 |
| claims -> patients | 0 |
| claims -> bills | 0 |
| billing_risk_scores -> bills | 0 |
| admissions -> beds | 0 |
| laboratory_tests -> patients | 0 |
| laboratory_tests -> doctors | 0 |

**Result: 0 orphan records across all relationships.**

---

## 5. Status / Enum Coverage

### Appointments
| Status | Count |
|--------|------:|
| Scheduled | 572 |
| Completed | 311 |
| Cancelled | 293 |
| Rescheduled | 424 |

### Bills (Payment Status)
| Status | Count |
|--------|------:|
| Pending | 126 |
| Partially Paid | 131 |
| Paid | 116 |
| Cancelled | 127 |

### Claims
| Status | Count |
|--------|------:|
| Submitted | 20 |
| Under Verification | 22 |
| Approved | 15 |
| Rejected | 23 |
| Paid | 20 |

### Billing Risk Scores
| Label | Count |
|-------|------:|
| Low | 48 |
| Medium | 55 |
| High | 47 |

### Laboratory Tests
| Status | Count |
|--------|------:|
| Ordered | 81 |
| Sample Collected | 93 |
| In Progress | 96 |
| Completed | 83 |
| Cancelled | 97 |

### Admissions
| Status | Count |
|--------|------:|
| Admitted | 59 |
| Discharged | 60 |
| Transferred | 61 |

### No-Show Predictions
| Label | Count |
|-------|------:|
| Low | 65 |
| Medium | 68 |
| High | 67 |

**All status enums have representation across all tables.**

---

## 6. Medicine Inventory Coverage

| Stock Level | Count | Percentage |
|-------------|------:|-----------:|
| In stock | 170 | 77% |
| Low stock (qty <= reorder level) | 28 | 13% |
| Out of stock (qty = 0) | 22 | 10% |

**Low-stock and out-of-stock items present for pharmacy alerts and AI recommendations.**

---

## 7. AI & Prediction API Verification

| Endpoint | Method | Status | Data |
|----------|--------|--------|------|
| `/api/ai/chat` | POST | 200 OK | Returns AI response |
| `/api/predictions/no-show` | GET | 200 OK | 20 records per page |
| `/api/predictions/bed-occupancy` | GET | 200 OK | 20 records per page |
| `/api/predictions/doctor-load` | GET | 200 OK | 20 records per page |
| `/api/predictions/medicine-demand` | GET | 200 OK | 50 records per page |
| `/api/predictions/billing-risk` | GET | 200 OK | 30 records per page |

**AI APIs return 200 OK. AI Chat correctly answers questions about the seeded data.**

---

## 8. Issues Found and Repaired

### Issue 1: Variable name conflict (`wardTypes`)
- **File:** `20260626120000-seed-all.js:692`
- **Root cause:** `wardTypes` declared twice (ward creation at line 254, bed occupancy forecast at line 692)
- **Fix:** Renamed second to `forecastWardTypes`

### Issue 2: Claim status enum mismatch
- **File:** `20260626120000-seed-all.js:784`
- **Root cause:** Seeder used `'Under Review'`; Claim model expects `'Under Verification'`
- **Fix:** Updated to match model enum values

### Issue 3: camelCase vs snake_case property access
- **File:** `20260626120000-seed-all.js:759,785,790,793,794`
- **Root cause:** Sequelize `bulkCreate({ returning: true })` returns model instances with camelCase properties (`paymentStatus`, `insuranceId`, `netAmount`, `patientId`), but the seeder accessed them with snake_case (`payment_status`, `insurance_id`, `net_amount`, `patient_id`)
- **Effect:** Filter expressions returned 0 matches, so `billing_risk_scores` and `claims` arrays were empty
- **Fix:** Changed all property access to camelCase

### Issue 4: Missing prediction/forecast seed data (pre-existing)
- **Root cause:** Original seeder had no code for prediction tables
- **Fix:** Added 6 new seeding steps (Steps 17-22) totaling ~120 lines

### Issue 5: No medicine stock level variation (pre-existing)
- **Root cause:** `helpers.js` generated all medicines with random stock 50-500, never producing low/out-of-stock
- **Fix:** Modified `generateMedicine()` to produce ~10% out-of-stock and ~15% low-stock items

---

## 9. Files Modified

| File | Changes |
|------|---------|
| `backend/src/seeders/20260626120000-seed-all.js` | +193 lines: 6 new seeding steps, 3 bug fixes, down() cleanup |
| `backend/src/seeders/helpers.js` | +2 lines: stock level variation logic |

---

## 10. API Verification Summary

| API Route | HTTP Status | Returns Data |
|-----------|-------------|-------------|
| POST `/api/auth/login` (all 8 roles) | 200 | Yes |
| GET `/api/patients` | 200 | 600 patients |
| GET `/api/appointments` | 200 | 1600 appointments |
| GET `/api/doctors` | 200 | 20 doctors |
| GET `/api/departments` | 200 | 10 departments |
| GET `/api/ehr` | 200 | 550 records |
| GET `/api/laboratory-tests` | 200 | 450 tests |
| GET `/api/medicines` | 200 | 220 medicines |
| GET `/api/prescriptions` | 200 | 1305 items |
| GET `/api/insurance` | 200 | 434 policies |
| GET `/api/bills` | 200 | 500 bills |
| GET `/api/enterprise/claims` | 200 | 100 claims |
| GET `/api/ward-management/wards` | 200 | Yes |
| GET `/api/ward-management/beds` | 200 | Yes |
| GET `/api/notifications` | 200 | Yes |
| GET `/api/activity-logs` | 200 | Yes |
| GET `/api/reports/patients` | 200 | Yes |
| POST `/api/ai/chat` | 200 | AI response |
| GET `/api/predictions/*` (5 endpoints) | 200 | Yes |

---

## 11. Remaining Limitations

1. **No expired medicines** in seed data (all expiry dates are future). Consider adding a few expired items for pharmacy alert testing.
2. **No "No Show" appointment status** in seed data (only Scheduled, Completed, Cancelled, Rescheduled). The model may not support it as a status enum.
3. **Analytics summary endpoint** returns 503 (service unavailable) — this is an application-level issue, not a seed data issue.
4. **Reports** only has `/patients` sub-route functional; other report routes return 404 — application routing issue, not seed data.

---

## 12. Conclusion

The seed data audit is **COMPLETE**. All 24 database tables are populated with realistic demo data. Every major feature of the SHMS application has sufficient seed data to function correctly:

- All 8 user roles have working credentials
- All status enums have balanced representation
- All foreign key relationships are valid (0 orphans)
- Medicine inventory includes low-stock and out-of-stock items
- All prediction/forecast/analytics tables are populated
- AI APIs return 200 OK with meaningful responses
- Insurance claims with all 5 statuses exist
- Billing risk scores with Low/Medium/High distribution exist
