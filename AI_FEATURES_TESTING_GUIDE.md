# AI Features - Quick Start Testing Guide

## 🚀 PREREQUISITE: Get JWT Token

First, log in to get a JWT token that will be used for all API tests.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shms.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@shms.com",
      "role": "Administrator",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

**Save the accessToken** - you'll use it in all following requests as:
```bash
Authorization: Bearer {accessToken}
```

---

## 1️⃣ TEST: Patient Summary Generator

Generate a clinical summary for a patient.

```bash
curl -X GET 'http://localhost:5000/api/ai/patient-summary/1' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "summary": "Clinical Summary:\n\nPatient John Smith is a 45-year-old male with a significant medical history including Type 2 Diabetes and Hypertension..."
  }
}
```

**What this tests:**
- ✅ Authentication middleware (JWT validation)
- ✅ Role-based access (Admin/Doctor only)
- ✅ Patient lookup from database
- ✅ AI service integration with Groq LLM
- ✅ Retry logic and error handling

**If you get an error:**
- `404`: Patient doesn't exist, try patient ID 1-10
- `401`: JWT token missing or expired
- `403`: Your role isn't authorized (Admin/Doctor required)
- `500`: AI service error - check GROQ_API_KEY is set

---

## 2️⃣ TEST: Medical Report Generator

Convert doctor notes to a formal medical report.

```bash
curl -X POST 'http://localhost:5000/api/ai/medical-report' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json' \
  -d '{
    "doctorNotes": "Patient came in complaining of severe headache for past 2 days. Started suddenly after work stress. Patient reports sensitivity to light. Temperature is 98.6, BP 120/80. Prescribed rest and Ibuprofen 400mg twice daily."
  }'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "report": "CHIEF COMPLAINT:\nSevere Headache\n\nHISTORY OF PRESENT ILLNESS:\n2-day history of severe headache that started suddenly after work-related stress. Patient reports light sensitivity. Vitals: Temperature 98.6°F, BP 120/80.\n\nCLINICAL ASSESSMENT:\nLikely tension headache triggered by stress with photophobia.\n\nDIAGNOSIS:\nTension Headache\n\nTREATMENT PLAN:\nRest and Ibuprofen 400mg twice daily for pain management...\n\nPATIENT EDUCATION:\nAvoid stress triggers, stay hydrated, maintain regular sleep schedule..."
  }
}
```

**What this tests:**
- ✅ POST request handling
- ✅ Request body validation
- ✅ AI service integration
- ✅ Structured report generation

---

## 3️⃣ TEST: Appointment Reminder Generator

Generate a personalized appointment reminder.

```bash
curl -X GET 'http://localhost:5000/api/ai/appointment-reminder/1' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "message": "Dear John,\n\nThis is a friendly reminder about your upcoming appointment with Dr. Sarah Johnson (Cardiology) on Thursday, January 23, 2025 at 10:30 AM.\n\nPlease arrive 15 minutes early to allow time for check-in. Please bring:\n- Insurance card\n- Photo ID\n- Any previous medical records\n\nOur cancellation policy requires at least 24 hours notice. If you need to reschedule, please call our scheduling department at (555-0123).\n\nWe look forward to seeing you soon!\n\nBest regards,\nSHMS Patient Scheduling Team"
  }
}
```

**What this tests:**
- ✅ Appointment lookup with patient and doctor relations
- ✅ Date/time formatting
- ✅ Personalized message generation
- ✅ Role-based access (Patient can view own, Receptionist can view all)

---

## 4️⃣ TEST: Hospital AI Chatbot (POST)

Ask the chatbot a question as an authenticated user.

```bash
curl -X POST 'http://localhost:5000/api/ai/chatbot' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are my upcoming appointments?",
    "patientId": null
  }'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "response": "Based on your patient profile, you have the following upcoming appointments...\n\n1. Appointment with Dr. Sarah Johnson (Cardiology) on January 23, 2025 at 10:30 AM\n2. Follow-up appointment with Dr. Michael Chen (Family Medicine) on February 5, 2025 at 2:00 PM\n\nPlease arrive 15 minutes early and bring your insurance card and ID."
  }
}
```

**Test as Different Roles:**

**As Patient:**
```bash
# After logging in as patient@test.com / patient123
curl -X POST 'http://localhost:5000/api/ai/chatbot' \
  -H 'Authorization: Bearer {PATIENT_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"query": "What prescriptions do I have?", "patientId": null}'
```
✅ Should show: Own prescriptions only
❌ Should NOT show: Other patients' data

**As Doctor:**
```bash
# After logging in as a doctor account
curl -X POST 'http://localhost:5000/api/ai/chatbot' \
  -H 'Authorization: Bearer {DOCTOR_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"query": "Show me appointments for patient 5", "patientId": 5}'
```
✅ Should show: Patient 5 if they're your assigned patient
❌ Should show: "Outside doctor scope" if not your patient

**What this tests:**
- ✅ Role-based context resolution
- ✅ Privacy enforcement (patients see only their data)
- ✅ Doctor scope limitations (own patients only)
- ✅ Optional patientId parameter handling

---

## 5️⃣ TEST: Scheduling Agent

Get intelligent appointment scheduling suggestions.

```bash
curl -X GET 'http://localhost:5000/api/agent/scheduling?date=2025-01-20&doctorId=1' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "doctorId": 1,
    "date": "2025-01-20",
    "availableSlots": [
      "09:00-10:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:30-16:30"
    ],
    "suggestions": "1) 09:00-09:30 | Peak consultation hour, ideal for routine checks and follow-ups\n2) 14:00-14:30 | Post-lunch availability, good for patient recovery and discussions\n3) 15:30-16:00 | End-of-day slot, perfect for urgent cases and emergency appointments"
  }
}
```

**What this tests:**
- ✅ LangChain StateGraph agent execution
- ✅ Database query for appointments
- ✅ Conflict-free slot generation
- ✅ AI LLM suggestion logic
- ✅ Fallback handling if LLM unavailable

---

## 6️⃣ TEST: Follow-up Agent

Trigger the follow-up reminder system for discharged patients.

```bash
curl -X POST 'http://localhost:5000/api/agent/follow-up/trigger' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "dischargedPatients": [
      {
        "id": 3,
        "reasonForAdmission": "Pneumonia treatment",
        "patient": { "id": 7, "firstName": "Michael", "lastName": "Brown", ... }
      }
    ],
    "followUpMessages": [
      {
        "patientId": 7,
        "message": "Hi Michael, we hope you're feeling better after your pneumonia treatment. Please continue taking your antibiotics as prescribed and watch for any fever or difficulty breathing. Follow-up appointment should be scheduled for next week. Take care!"
      }
    ]
  }
}
```

**What this tests:**
- ✅ Discharge patient identification (last 24 hours)
- ✅ Personalized message generation
- ✅ Notification creation and delivery
- ✅ Audit logging
- ✅ Role-based scoping (Doctor sees own patients)

**Check Notifications:**
```bash
curl -X GET 'http://localhost:5000/api/notifications' \
  -H 'Authorization: Bearer {PATIENT_TOKEN}'
```

Should show the follow-up notification.

---

## 7️⃣ TEST: Inventory Agent

Trigger medicine inventory analysis.

```bash
curl -X POST 'http://localhost:5000/api/agent/inventory/trigger' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "lowStock": [
      { "id": 1, "name": "Aspirin 500mg", "quantity": 45, "reorderLevel": 100 },
      { "id": 3, "name": "Ibuprofen 200mg", "quantity": 80, "reorderLevel": 150 }
    ],
    "recommendations": "- Aspirin 500mg | Recommend 150 units | Priority: HIGH | Critical OTC medication with consistent demand\n- Ibuprofen 200mg | Recommend 200 units | Priority: HIGH | Pain management essential, recent usage spike\n- Paracetamol 650mg | Recommend 180 units | Priority: MEDIUM | Standard analgesic, inventory adequate but trending down"
  }
}
```

**What this tests:**
- ✅ Low stock detection
- ✅ Usage analysis from prescription items
- ✅ Reorder quantity calculation with safety buffer
- ✅ Priority ranking logic
- ✅ Pharmacist-only access (403 if not Pharmacist/Admin)

---

## 8️⃣ TEST: Billing Agent

Trigger billing analysis and patient notifications.

```bash
curl -X POST 'http://localhost:5000/api/agent/billing/trigger' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "pendingBills": [
      { "id": 1, "billNumber": "INV-2024-001", "netAmount": 1500, "patient": { "firstName": "Sarah" } },
      { "id": 2, "billNumber": "INV-2024-002", "netAmount": 2300, "patient": { "firstName": "Michael" } },
      { "id": 3, "billNumber": "INV-2024-003", "netAmount": 890, "patient": { "firstName": "John" } }
    ],
    "billingInsights": "1) Collection Risk Summary: 23 pending invoices totaling $45,600. Historical collection rate 65% within 30 days, suggesting $15,960 at risk.\n2) Priority Follow-up: Contact top 5 accounts (Sarah M., Michael B., John P., etc.) representing 60% of outstanding amount. Focus on INV-2024-001, INV-2024-002, INV-2024-003.\n3) Patient Template: 'Hi [Name], we noticed your hospital account has a balance of $[AMOUNT]. Please contact billing at (555-0456) or reply with preferred payment method. We offer payment plans for amounts over $1,000.'"
  }
}
```

**What this tests:**
- ✅ Pending bill identification
- ✅ Collection risk analysis
- ✅ Patient notification creation
- ✅ Billing staff template generation
- ✅ Billing Staff-only access

**Check Patient Notifications:**
```bash
curl -X GET 'http://localhost:5000/api/notifications' \
  -H 'Authorization: Bearer {PATIENT_TOKEN}'
```

Should show pending bill notification.

---

## 9️⃣ TEST: Agent Execution History

View audit log of all agent executions.

```bash
curl -X GET 'http://localhost:5000/api/agent/history?limit=10' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "executions": [
      {
        "id": 1,
        "entityType": "Agent",
        "entityId": "BillingAgent",
        "action": "AGENT_SUCCESS",
        "actor": { "id": 1, "firstName": "Admin", "role": "Administrator" },
        "metadata": {
          "triggerType": "manual",
          "role": "Administrator",
          "status": "SUCCESS"
        },
        "createdAt": "2025-01-17T15:30:45Z"
      },
      {
        "id": 2,
        "entityType": "Agent",
        "entityId": "FollowUpAgent",
        "action": "AGENT_SUCCESS",
        "actor": { "id": 2, "firstName": "Dr. Sarah", "role": "Doctor" },
        "metadata": {
          "triggerType": "manual",
          "role": "Doctor",
          "status": "SUCCESS"
        },
        "createdAt": "2025-01-17T14:15:20Z"
      }
    ]
  }
}
```

**What this tests:**
- ✅ Audit logging functionality
- ✅ Agent execution tracking
- ✅ User context preservation
- ✅ Timestamp recording

---

## 🔟 TEST: Agent Schedules Configuration

View current agent schedules and configuration.

```bash
curl -X GET 'http://localhost:5000/api/agent/schedules' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}' \
  -H 'Content-Type: application/json'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "schedules": {
      "followUp": "0 8 * * *",
      "inventory": "0 22 * * *",
      "billing": "0 9 * * *",
      "appointmentReminders": "0 7 * * *"
    }
  }
}
```

**Cron Schedule Explanation:**
- `0 8 * * *` = Every day at 8:00 AM
- `0 22 * * *` = Every day at 10:00 PM  
- `0 9 * * *` = Every day at 9:00 AM
- `0 7 * * *` = Every day at 7:00 AM

---

## ✅ VERIFICATION CHECKLIST

After running all tests, verify:

- [x] All endpoints return 200 status (or appropriate error)
- [x] Authentication works (JWT token required)
- [x] Role-based access works (403 if unauthorized role)
- [x] AI responses are generated (not empty)
- [x] Fallback messages appear if API key missing
- [x] Agents return expected data structures
- [x] Audit logs record agent executions
- [x] Notifications are created for patients

---

## 🆘 TROUBLESHOOTING

### Issue: 401 Unauthorized
**Cause:** JWT token expired or missing
**Solution:** 
1. Log in again to get a fresh token
2. Ensure token is included in Authorization header
3. Check token hasn't been modified

### Issue: 403 Forbidden
**Cause:** Your role isn't authorized for this endpoint
**Solution:**
1. Check the role-based access matrix above
2. Log in as a different role (Admin can access most features)
3. Use demo credentials: `admin@shms.com` / `admin123`

### Issue: 500 Internal Server Error
**Cause:** AI provider key not configured or database error
**Solution:**
1. Check `GROQ_API_KEY` is set in backend/.env
2. Verify database is running: `docker ps`
3. Check backend logs: `docker logs shms-backend`

### Issue: 404 Not Found
**Cause:** Patient/Appointment/Doctor doesn't exist
**Solution:**
1. Check ID exists in database
2. Try ID 1-10 for demo data
3. Query `/api/patients` to see available patients

### Issue: Empty AI response
**Cause:** API key not configured
**Solution:**
1. Set GROQ_API_KEY in backend/.env
2. Restart backend container
3. System will use fallback messages without key

---

## 📊 SAMPLE DATA VERIFICATION

Check what demo data exists:

```bash
# List all patients
curl -X GET 'http://localhost:5000/api/patients' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}'

# List all doctors  
curl -X GET 'http://localhost:5000/api/doctors' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}'

# List all appointments
curl -X GET 'http://localhost:5000/api/appointments' \
  -H 'Authorization: Bearer {YOUR_TOKEN_HERE}'
```

---

## 🎯 NEXT STEPS

After verifying all tests pass:

1. **Email Integration**
   - Set up email provider (SendGrid, AWS SES)
   - Update notificationService to send emails
   - Test appointment reminders via email

2. **SMS Integration**
   - Set up SMS provider (Twilio, AWS SNS)
   - Update notificationService to send SMS
   - Test follow-up messages via SMS

3. **Frontend UI**
   - Create AI Center page
   - Add chatbot widget
   - Create agent dashboard for staff

4. **Schedule Agents**
   - Set up node-cron or similar for automatic execution
   - Configure cron schedules in environment
   - Test daily agent runs

---

**Last Updated:** January 17, 2025
