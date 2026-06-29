const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  return next();
};

const validatePatientSummary = [
  param('patientId').isUUID().withMessage('patientId must be a valid UUID'),
  handleValidation,
];

const validateMedicalReport = [
  body('doctorNotes')
    .trim()
    .notEmpty()
    .withMessage('doctorNotes is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('doctorNotes must be between 10 and 5000 characters'),
  handleValidation,
];

const validateAppointmentReminder = [
  param('appointmentId').isUUID().withMessage('appointmentId must be a valid UUID'),
  handleValidation,
];

const validateChatbotQuery = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('query is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('query must be between 2 and 2000 characters'),
  body('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  handleValidation,
];

const validateChatbotGetQuery = [
  query('query')
    .trim()
    .notEmpty()
    .withMessage('query is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('query must be between 2 and 2000 characters'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  handleValidation,
];

module.exports = {
  validatePatientSummary,
  validateMedicalReport,
  validateAppointmentReminder,
  validateChatbotQuery,
  validateChatbotGetQuery,
};
