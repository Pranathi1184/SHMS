const { body, query, validationResult } = require('express-validator');

const validateCreateEHR = [
  body('patientId').notEmpty().withMessage('Patient ID is required').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required').isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('symptoms').optional().trim(),
  body('treatmentPlan').optional().trim(),
  body('notes').optional().trim(),
  body('appointmentId').optional().isUUID().withMessage('Appointment ID must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateEHR = [
  body('diagnosis').optional().trim().notEmpty().withMessage('Diagnosis is required if provided'),
  body('symptoms').optional().trim(),
  body('treatmentPlan').optional().trim(),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetEHRs = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  query('doctorId').optional().isUUID().withMessage('doctorId must be a valid UUID'),
  query('appointmentId').optional().isUUID().withMessage('appointmentId must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateEHR,
  validateUpdateEHR,
  validateGetEHRs,
};
