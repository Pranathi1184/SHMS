const { body, query, validationResult } = require('express-validator');

const validateCreatePrescription = [
  body('patientId').notEmpty().withMessage('Patient ID is required').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required').isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('ehrId').optional().isUUID().withMessage('EHR ID must be a valid UUID'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one prescription item is required'),
  body('items.*.medicineId').notEmpty().withMessage('Medicine ID is required for each item').isUUID().withMessage('Medicine ID must be a valid UUID'),
  body('items.*.dosage').trim().notEmpty().withMessage('Dosage is required for each item'),
  body('items.*.frequency').trim().notEmpty().withMessage('Frequency is required for each item'),
  body('items.*.duration').trim().notEmpty().withMessage('Duration is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1 for each item'),
  body('items.*.instructions').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdatePrescription = [
  body('notes').optional().trim(),
  body('status').optional().isIn(['Pending', 'Dispensed', 'Cancelled']).withMessage('Invalid prescription status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetPrescriptions = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  query('doctorId').optional().isUUID().withMessage('doctorId must be a valid UUID'),
  query('status').optional().isIn(['Pending', 'Dispensed', 'Cancelled']).withMessage('Invalid prescription status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreatePrescription,
  validateUpdatePrescription,
  validateGetPrescriptions,
};
