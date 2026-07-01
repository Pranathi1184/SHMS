const promptTemplates = {
  patientSummary: (patientData) => {
    const data = patientData?.dataValues || patientData || {};
    const medications = (data.prescriptions || [])
      .flatMap((prescription) => {
        const items = prescription?.items || [];
        return items.map((item) => {
          const medicineName = item?.medicine?.name || item?.medicationName || 'Unknown medicine';
          const dose = item?.dosage || item?.frequency || 'dosage not specified';
          return `${medicineName} (${dose})`;
        });
      })
      .filter(Boolean)
      .join(', ') || 'None listed';
    
    return `You are a clinical physician creating a handoff summary. Based on the patient history below, provide a CONCISE clinical summary.

PATIENT: ${data.firstName || ''} ${data.lastName || ''} | Age: ${data.dateOfBirth || 'N/A'} | Blood: ${data.bloodType || 'N/A'}
ALLERGIES: ${data.allergies || 'NKDA'}
CONDITIONS: ${data.chronicConditions || 'None documented'}
MEDICATIONS: ${medications}

SUMMARY REQUIREMENTS:
� Key diagnoses and recurring issues (2-3 main points)
� Important medication/allergy considerations  
� Overall health status assessment
� Any concerning trends or patterns
� Recommended follow-up timeline

KEEP UNDER 150 WORDS. Use professional medical language only. Reference only information provided.

CLINICAL SUMMARY:`;
  },

  medicalReport: (doctorNotes) => `Convert these informal notes into a FORMAL medical report structure:

DOCTOR NOTES INPUT:
${doctorNotes}

CREATE SECTIONS:
**CHIEF COMPLAINT:** [Main health concern]
**HISTORY OF PRESENT ILLNESS:** [Symptom timeline and details]
**CLINICAL ASSESSMENT:** [Professional evaluation]
**DIAGNOSIS:** [Primary diagnosis]  
**TREATMENT PLAN:** [Medications, procedures, advice]
**FOLLOW-UP:** [When to return/next steps]

BE PROFESSIONAL | Reference only provided information | Include specific instructions for patient.

FORMAL REPORT:`,

  appointmentReminder: (appointmentDetails) => {
    const appt = appointmentDetails?.dataValues || appointmentDetails || {};
    const patientName = appt.patient?.firstName || 'Patient';
    const doctorName = appt.doctor?.user?.firstName || 'Doctor';
    const doctorLast = appt.doctor?.user?.lastName || '';
    const specialty = appt.doctor?.specialization || '';
    const date = appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}) : 'your scheduled date';
    const time = appt.startTime || 'your scheduled time';
    
    return `Create a FRIENDLY, PROFESSIONAL appointment reminder:

DETAILS:
Name: ${patientName}
Doctor: Dr. ${doctorName} ${doctorLast} (${specialty})
Date/Time: ${date} at ${time}

INCLUDE:
� Warm greeting with patient name
� Doctor name, specialty, and appointment details (date/time/location)
� REQUEST to arrive 15 minutes early
� WHAT TO BRING: Insurance card, ID, previous medical records
� 24-HOUR cancellation policy
� Contact: "Call (555-0123) to reschedule"
� Professional closing

TONE: Friendly but professional. KEEP UNDER 150 WORDS.

REMINDER MESSAGE:`;
  },

  chatbot: (query, context, role) => `You are SHMS AI Assistant. Provide role-appropriate, scope-limited responses using ONLY the provided context.

VIEWER ROLE: ${role}
CONTEXT: ${JSON.stringify(context, null, 2)}

REQUEST CONTEXT: ${JSON.stringify(context?.clientContext || null, null, 2)}

STRICT RULES:
? Never invent data or diagnoses
? Never expose data outside this user's scope
? Patients see ONLY their own data
? Doctors see ONLY their patients
? Say "I don't have that information" if missing
? If the query requests details not present in CONTEXT, explicitly list which fields are missing
? Do not infer dates, values, IDs, statuses, or names that are not explicitly present in CONTEXT
? When citing facts, refer to the exact context area (for example: patient profile, appointments, bills)
? If REQUEST CONTEXT is provided, use it as the user's current task framing but do not treat it as medical fact

ROLE PERMISSIONS:
Admin: All hospital data | Doctor: Own patients only | Nurse: Today''s assignments | Receptionist: Scheduling only | Patient: Own records only | Other: Operational data only

USER QUERY: "${query}"

RESPONSE FORMAT:
1) Direct answer (1-4 lines)
2) Evidence from context (short bullets)
3) Limitation note if any information is missing

RESPONSE (Use provided context only. If outside scope, explain limitation clearly):`,
};

module.exports = {
  promptTemplates,
};
