# SHMS AI & Agent Features - Complete Implementation Guide

## ✅ Current Implementation Status

### 4 Generative AI Features (100% Implemented)
1. **Patient Summary Generator** - Generates clinical summaries from patient records
2. **Medical Report Generator** - Converts doctor notes to structured reports
3. **Appointment Reminder Generator** - Creates personalized appointment reminders
4. **Hospital AI Chatbot** - Role-aware chatbot for all users

### 4 Agentic AI Features (100% Implemented)
1. **Smart Scheduling Agent** - Intelligent appointment scheduling with conflict detection
2. **Follow-up Agent** - Identifies patients needing follow-up care
3. **Inventory Agent** - Analyzes pharmacy stock and generates reorder recommendations
4. **Billing Agent** - Highlights outstanding payments and sends notifications

---

## GENERATIVE AI FEATURES

### 1. Patient Summary Generator

**Endpoint:** `GET /api/ai/patient-summary/:patientId`

**Allowed Roles:** Admin, Doctor

**Purpose:** Generate clinical summary from comprehensive patient history

**Request:**
```bash
GET /api/ai/patient-summary/1
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "summary": "Clinical Summary:\n\n45-year-old male with Type 2 Diabetes..."
  }
}
```

**What it reads from patient:**
- Demographics (name, age, gender, blood type)
- Chronic conditions and known allergies
- Current medications and dosages
- Laboratory test history
- Previous appointments and treatments
- EHR records

**AI Prompt Strategy:**
- Instructs LLM to extract key diagnoses, recurring issues, and health status
- Limits output to 150 words for brevity
- Uses professional medical terminology
- References only provided information (never invents diagnoses)

**Backend Code Flow:**
```
1. Validate patient exists
2. Load: EHR records, Lab tests, Prescriptions
3. Pass to aiService.generatePatientSummary()
4. Call LLM with enhanced prompt template
5. Return generated summary with 200 status
```

---

### 2. Medical Report Generator

**Endpoint:** `POST /api/ai/medical-report`

**Allowed Roles:** Admin, Doctor

**Purpose:** Convert informal doctor notes into formal structured medical report

**Request:**
```json
POST /api/ai/medical-report
Authorization: Bearer {JWT_TOKEN}

{
  "doctorNotes": "Patient came in with severe headache this morning. Started 2 days ago. Took aspirin but didn't help. Nausea with it. No fever."
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "report": "CHIEF COMPLAINT:\nSevere headache\n\nHISTORY OF PRESENT ILLNESS:\n2-day history of severe headache..."
  }
}
```

**Report Sections Generated:**
1. **CHIEF COMPLAINT** - Main health concern
2. **HISTORY OF PRESENT ILLNESS** - Timeline and details
3. **CLINICAL ASSESSMENT** - Professional evaluation
4. **DIAGNOSIS** - Primary diagnosis
5. **TREATMENT PLAN** - Medications, procedures, follow-up
6. **PATIENT EDUCATION** - Do's and don'ts

**Backend Code Flow:**
```
1. Validate doctorNotes provided (not empty)
2. Pass to aiService.generateMedicalReport()
3. Call LLM with structured prompt requesting sections
4. Return formatted report with 200 status
5. Doctor can edit/approve before storing
```

---

### 3. Appointment Reminder Generator

**Endpoint:** `GET /api/ai/appointment-reminder/:appointmentId`

**Allowed Roles:** Admin, Doctor, Receptionist, Patient

**Purpose:** Generate personalized, warm appointment reminder messages

**Request:**
```bash
GET /api/ai/appointment-reminder/42
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "message": "Dear Sarah,\n\nThis is a friendly reminder about your upcoming appointment with Dr. James Smith (Cardiology) on Friday, January 17, 2025 at 10:00 AM.\n\nPlease arrive 15 minutes early to complete check-in..."
  }
}
```

**Information Extracted:**
- Patient name and contact
- Doctor name and specialty
- Appointment date/time
- Location
- Appointment type

**Reminder Content Generated:**
- Warm greeting with patient name
- Full appointment details (date, time, doctor, specialty)
- Request to arrive 15 minutes early
- What to bring (insurance, ID, previous reports)
- 24-hour cancellation policy
- Contact number for rescheduling
- Professional closing

**Delivery Methods (Future Integration):**
- [ ] Email to patient
- [ ] SMS message
- [ ] In-app notification
- [ ] WhatsApp message

**Backend Code Flow:**
```
1. Fetch appointment with patient and doctor details
2. Verify appointment exists (404 if not)
3. Pass to aiService.generateAppointmentReminder()
4. Call LLM with appointment details in prompt
5. Return message ready for sending
6. Future: Send via email/SMS/app notification
```

---

### 4. Hospital AI Chatbot

**Endpoints:**
- `POST /api/ai/chatbot` - For queries in request body
- `GET /api/ai/chat` - For queries in query parameters

**Allowed Roles:** All 8 roles (Admin, Doctor, Nurse, Receptionist, Lab Tech, Pharmacist, Billing, Patient)

**Purpose:** Provide role-aware hospital guidance with scope-limited responses

**Request (POST):**
```json
POST /api/ai/chatbot
Authorization: Bearer {JWT_TOKEN}

{
  "query": "What are my upcoming appointments?",
  "patientId": null
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "response": "Based on your patient profile, you have the following upcoming appointments..."
  }
}
```

**Role-Based Permissions:**

| Role | Can See | Cannot See |
|------|---------|-----------|
| **Admin** | All operational data, any patient | Limited to system-wide metrics |
| **Doctor** | Own patients, own schedule | Other doctors' patients |
| **Nurse** | Today's assigned patients, vitals | Billing, financial data |
| **Receptionist** | Appointment availability, today's schedule | Clinical data, patient medical history |
| **Lab Tech** | Pending tests, results for their scope | Prescriptions, diagnoses |
| **Pharmacist** | Inventory, expiry dates | Patient data, clinical records |
| **Billing Staff** | Unpaid invoices, insurance claims | Clinical or medication data |
| **Patient** | Own appointments, prescriptions, bills | Other patients' data (strict privacy) |

**Context Resolution Process:**
```javascript
if (viewer.role === 'Patient') {
  // Load: Own patient profile, prescriptions, appointments, lab tests
  // Block: Any other patient's data
}
if (viewer.role === 'Doctor') {
  // Load: Own patients' appointments and clinical data
  // Block: Unrelated patients (checked against appointment list)
}
if (viewer.role === 'Administrator') {
  // Load: Hospital-wide metrics (patient count, doctor count, pending bills)
  // Allow: Query any specific patient if needed
}
```

**Safety Guarantees:**
- ✅ Never invents medical data, diagnoses, or billing facts
- ✅ Explicitly states when data is missing or out of scope
- ✅ Patient privacy strictly enforced (can't see other patients' data)
- ✅ Uses only provided context (never makes up information)

**Backend Code Flow:**
```
1. Extract query and optional patientId from request
2. Call resolveChatbotContext() with viewer info
3. Context resolution loads role-appropriate data
4. Pass query + context to aiService.hospitalChatbot()
5. Call LLM with strict safety rules in prompt
6. Return response that only references provided context
```

---

## AGENTIC AI FEATURES

### 1. Smart Scheduling Agent

**Endpoint:** `GET /api/agent/scheduling?date=2025-01-17&doctorId=1`

**Allowed Roles:** Admin, Receptionist, Doctor, Nurse, Lab Tech, Pharmacist, Billing, Patient

**Purpose:** Suggest 3 conflict-free appointment slots for a given date

**Request:**
```bash
GET /api/agent/scheduling?date=2025-01-17
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "doctorId": null,
    "date": "2025-01-17",
    "availableSlots": [
      "09:00-10:00",
      "10:30-11:00",
      "14:00-15:00"
    ],
    "suggestions": "1) 09:00-09:30 | Peak consultation hour, ideal for routine checks\n2) 14:00-14:30 | Post-lunch availability, good for follow-ups\n3) 15:30-16:00 | End-of-day slot, perfect for urgent cases"
  }
}
```

**What the Agent Does:**
1. Fetches all appointments for the date
2. Identifies booked time slots (no double-booking)
3. Suggests 3 conflict-free 30-minute slots between 09:00-17:00
4. Keeps 1 buffer gap free for urgent cases
5. Prioritizes mornings (better patient attendance)

**Doctor-Specific Behavior:**
- If doctor passes `doctorId`: Shows only that doctor's schedule
- If no `doctorId`: Shows all doctors' availability

**LangChain Workflow:**
```
State Graph with 2 nodes:
1. fetch_availability
   - Query appointments for the date
   - Extract booked slots
   - Return available times

2. suggest_slots
   - Call LLM with available slots
   - LLM suggests 3 best times with reasoning
   - Return formatted suggestions
```

**Fallback (No API Key):**
```
Returns: "Booked slots: [list]. Prefer open gaps before 11:00 or after 15:00..."
```

---

### 2. Follow-up Agent

**Endpoint:** `POST /api/agent/follow-up/trigger`

**Allowed Roles:** Admin, Doctor, Nurse

**Purpose:** Identify recently discharged patients and send personalized follow-up messages

**Request:**
```bash
POST /api/agent/follow-up/trigger
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "dischargedPatients": [
      {
        "id": 5,
        "reasonForAdmission": "Pneumonia treatment",
        "patient": { "id": 10, "firstName": "John", ... }
      }
    ],
    "followUpMessages": [
      {
        "patientId": 10,
        "message": "Hi John, we hope you're feeling better after your recent hospital stay. Please remember to take all medications as prescribed..."
      }
    ]
  }
}
```

**What the Agent Does:**
1. Queries patients discharged in the last 24 hours
2. For each, generates personalized follow-up message
3. Sends notifications to patient's linked user account
4. Logs action in audit trail

**Role-Based Scoping:**
- **Admin**: Sees all recently discharged patients
- **Doctor**: Sees only own patients who were discharged
- **Nurse**: Sees all recent discharges (ward management)

**Follow-up Message Includes:**
- Greeting with patient name
- Medication adherence reminder
- One warning sign to watch for
- Follow-up appointment timing
- Max 90 words (clear and actionable)

**LangChain Workflow:**
```
State Graph with 2 nodes:
1. fetch_discharges
   - Query admissions with status='Discharged'
   - Filter by dischargeDate >= yesterday
   - Role-based filtering (doctor sees own patients only)

2. generate_reminders
   - For each patient, generate message via LLM
   - Create notifications for patient users
   - Return all generated messages
```

**Cron Schedule:** `0 8 * * *` (8 AM daily, can be configured)

**Notification Delivery:**
- In-app notification created
- Future: Email and SMS integration

---

### 3. Inventory Agent

**Endpoint:** `POST /api/agent/inventory/trigger`

**Allowed Roles:** Admin, Pharmacist

**Purpose:** Analyze pharmacy stock levels and recommend reorder quantities

**Request:**
```bash
POST /api/agent/inventory/trigger
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "lowStock": [
      { "id": 3, "name": "Aspirin 500mg", "quantity": 45, "reorderLevel": 100 },
      { "id": 7, "name": "Ibuprofen 200mg", "quantity": 80, "reorderLevel": 150 }
    ],
    "recommendations": "- Aspirin 500mg | Recommend 150 units | Priority: HIGH | Critical medication\n- Ibuprofen 200mg | Recommend 180 units | Priority: HIGH | High usage..."
  }
}
```

**What the Agent Does:**
1. Checks medicines where `quantity <= reorderLevel`
2. Analyzes last 30 days usage from prescriptions
3. Calculates 30-day need with 20% safety buffer
4. Generates prioritized reorder recommendations
5. Applies FEFO (First Expired, First Out) principle

**Recommendation Output:**
- Medicine name
- Recommended reorder quantity
- Priority level (High/Medium/Low)
- Reason (critical medication, high usage, expiry soon)

**Stock Level Analysis:**
```
Low Stock Items Query:
SELECT * FROM medicines 
WHERE quantity <= reorder_level

Usage Analysis (Last 30 days):
SELECT medicineId, SUM(quantity) as usage
FROM prescription_items
WHERE createdAt >= NOW() - INTERVAL 30 days
GROUP BY medicineId

Recommended Qty = CEIL(monthlyUsage * 1.2)
  (1.2 = 20% safety buffer)
```

**LangChain Workflow:**
```
State Graph with 2 nodes:
1. check_stock
   - Query low stock medicines
   - Calculate usage from prescriptions
   - Return low stock list

2. generate_order_plan
   - Format medicine details for LLM
   - Call LLM with FEFO and priority rules
   - Return prioritized recommendations
```

**Cron Schedule:** `0 22 * * *` (10 PM daily, can be configured)

---

### 4. Billing Agent

**Endpoint:** `POST /api/agent/billing/trigger`

**Allowed Roles:** Admin, Billing Staff

**Purpose:** Identify overdue payments and generate collection strategies

**Request:**
```bash
POST /api/agent/billing/trigger
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "pendingBills": [
      { "id": 1, "billNumber": "INV-2024-001", "netAmount": 1500, "patient": { "firstName": "Sarah" } },
      { "id": 2, "billNumber": "INV-2024-002", "netAmount": 2300, "patient": { "firstName": "Michael" } }
    ],
    "billingInsights": "1) Collection Risk Summary: 23 pending invoices totaling $45,600 with 12% payment rate over 30 days\n2) Priority Follow-up Sequence: Contact top 5 outstanding payers first...\n3) Patient Template: 'Hi [Name], we noticed your hospital account has a pending balance...'"
  }
}
```

**What the Agent Does:**
1. Fetches all bills with status = 'Pending'
2. Analyzes collection risk based on amount and age
3. Prioritizes high-value overdue accounts
4. Generates collection strategy for staff
5. Sends payment reminders to patient accounts
6. Logs all actions in audit trail

**Billing Analysis Includes:**
- Total pending amount
- Number of outstanding bills
- Risk assessment (payment likelihood)
- Priority follow-up sequence
- Reusable patient reminder template

**Patient Notification:**
- Amount due
- Payment options
- Contact billing for assistance
- Delivered via in-app notification

**LangChain Workflow:**
```
State Graph with 2 nodes:
1. fetch_pending
   - Query bills with status='Pending'
   - Include patient info for mapping
   - Calculate total pending

2. analyze_and_remind
   - Format data for LLM analysis
   - Call LLM for collection strategy
   - Send notifications to patients
   - Return insights and messages
```

**Cron Schedule:** `0 9 * * *` (9 AM daily, can be configured)

**Patient Reminder Template:**
```
Subject: Outstanding Hospital Payment

You have pending hospital payments totaling $[AMOUNT]. 
Please contact our billing department at [PHONE] to arrange payment.
```

---

## AGENT EXECUTION ENDPOINTS

### View Agent Execution History

**Endpoint:** `GET /api/agent/history?limit=50`

**Allowed Roles:** Admin, Doctor, Nurse, Receptionist, Pharmacist, Billing Staff

**Purpose:** View audit log of all agent executions

**Response:**
```json
{
  "status": "success",
  "data": {
    "executions": [
      {
        "id": 1,
        "entityType": "Agent",
        "entityId": "SchedulingAgent",
        "action": "AGENT_SUCCESS",
        "actor": { "id": 1, "firstName": "Admin", "role": "Administrator" },
        "metadata": {
          "triggerType": "manual",
          "role": "Administrator",
          "status": "SUCCESS"
        },
        "createdAt": "2025-01-17T10:30:00Z"
      }
    ]
  }
}
```

---

### View Agent Schedules

**Endpoint:** `GET /api/agent/schedules`

**Allowed Roles:** Admin

**Response:**
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

---

## ROLE-BASED ACCESS MATRIX

| Feature | Admin | Doctor | Nurse | Receptionist | Lab Tech | Pharmacist | Billing | Patient |
|---------|-------|--------|-------|--------------|----------|------------|---------|---------|
| Patient Summary | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Medical Report | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Appointment Reminder | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Chatbot | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scheduling | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follow-up | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## ENVIRONMENT VARIABLES REQUIRED

```bash
# AI Provider Configuration
AI_PROVIDER=groq                    # Options: groq, openai, gemini, bedrock
GROQ_API_KEY=...                   # Groq API Key
GROQ_MODEL=llama-3.1-8b-instant    # Groq model name

# Optional: OpenAI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4

# Optional: Google Gemini
GEMINI_API_KEY=...

# Optional: AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Agent Configuration
ENABLE_AGENT_JOBS=true              # Enable scheduled agents

# Cron Schedules (optional - uses defaults if not set)
CRON_FOLLOW_UP=0 8 * * *           # 8 AM daily
CRON_INVENTORY=0 22 * * *          # 10 PM daily
CRON_BILLING=0 9 * * *             # 9 AM daily
CRON_APPOINTMENT_REMINDERS=0 7 * * * # 7 AM daily

# Retry Configuration
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY_MS=500
AGENT_RETRY_ATTEMPTS=3
AGENT_RETRY_DELAY_MS=500
```

---

## ERROR HANDLING

### Common Errors

**400 Bad Request**
```json
{ "status": "error", "message": "Validation failed" }
```

**401 Unauthorized**
```json
{ "status": "error", "message": "Unauthorized" }
```

**403 Forbidden**
```json
{ "status": "error", "message": "Access denied for this role" }
```

**404 Not Found**
```json
{ "status": "error", "message": "Patient not found" }
```

**500 Internal Server Error**
```json
{ "status": "error", "message": "Failed to [operation]" }
```

**Fallback When API Key Missing:**
```json
{
  "status": "success",
  "data": {
    "response": "Feature unavailable because AI provider key is not configured."
  }
}
```

---

## SECURITY & PRIVACY MEASURES

✅ **Authentication:** JWT token required for all endpoints
✅ **Authorization:** Role-based access control on all features
✅ **Data Privacy:** Chatbot context strictly filtered by role
✅ **Audit Logging:** All agent executions logged
✅ **No Data Invention:** LLM prompts explicitly forbid hallucination
✅ **Scope Enforcement:** Doctors can't access other doctors' patients
✅ **Patient Privacy:** Patients can only see their own data
✅ **Input Validation:** All user inputs validated before processing

---

## TESTING THE FEATURES

### 1. Test Patient Summary
```bash
curl -X GET http://localhost:5000/api/ai/patient-summary/1 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 2. Test Medical Report
```bash
curl -X POST http://localhost:5000/api/ai/medical-report \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorNotes": "Patient has persistent cough for 3 weeks, temperature 101F, chest pain on breathing"
  }'
```

### 3. Test Appointment Reminder
```bash
curl -X GET http://localhost:5000/api/ai/appointment-reminder/1 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 4. Test Chatbot
```bash
curl -X POST http://localhost:5000/api/ai/chatbot \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are my upcoming appointments?",
    "patientId": null
  }'
```

### 5. Test Scheduling Agent
```bash
curl -X GET http://localhost:5000/api/agent/scheduling?date=2025-01-20 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 6. Test Follow-up Agent (Admin trigger)
```bash
curl -X POST http://localhost:5000/api/agent/follow-up/trigger \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 7. Test Inventory Agent (Pharmacist trigger)
```bash
curl -X POST http://localhost:5000/api/agent/inventory/trigger \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### 8. Test Billing Agent (Billing staff trigger)
```bash
curl -X POST http://localhost:5000/api/agent/billing/trigger \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

## NEXT STEPS FOR PRODUCTION

- [ ] Implement email delivery for appointment reminders
- [ ] Add SMS integration for patient notifications
- [ ] Implement scheduled agent jobs with node-cron or similar
- [ ] Add frontend UI pages for AI Center
- [ ] Create admin dashboard for agent configuration
- [ ] Implement monitoring/alerting for failed agents
- [ ] Add batch processing for large dataset operations
- [ ] Set up comprehensive logging and analytics

---

**Last Updated:** January 17, 2025
**System:** SHMS - Smart Hospital Management System
**Version:** 1.0
