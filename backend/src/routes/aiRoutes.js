const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const {
  validatePatientSummary,
  validateMedicalReport,
  validateAppointmentReminder,
  validateChatbotQuery,
  validateChatbotGetQuery,
} = require('../validations/ai');

router.get(
  '/patient-summary/:patientId',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Patient'),
  validatePatientSummary,
  aiController.getPatientSummary
);

router.post(
  '/medical-report',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor'),
  validateMedicalReport,
  aiController.getMedicalReport
);

router.get(
  '/appointment-reminder/:appointmentId',
  authenticateToken,
  authorizeRoles('Administrator', 'Receptionist', 'Doctor', 'Patient'),
  validateAppointmentReminder,
  aiController.getReminderMessage
);

router.post(
  '/chatbot',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'),
  validateChatbotQuery,
  aiController.handleChatbotQuery
);

router.get(
  '/chatbot',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'),
  validateChatbotGetQuery,
  aiController.handleChatbotQueryGet
);

router.post(
  '/chat',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'),
  validateChatbotQuery,
  aiController.handleChatbotQuery
);

module.exports = router;
