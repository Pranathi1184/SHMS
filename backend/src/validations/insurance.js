const { body, query, validationResult } = require('express-validator');

const validateCreateInsurance = [
  body('patientId').notEmpty().withMessage('Patient ID is required').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('providerName').trim().notEmpty().withMessage('Provider name is required'),
  body('policyNumber').trim().notEmpty().withMessage('Policy number is required'),
  body('policyHolderName').trim().notEmpty().withMessage('Policy holder name is required'),
  body('relationshipToPatient').optional().trim(),
  body('coverageStartDate').isDate().withMessage('Valid coverage start date is required'),
  body('coverageEndDate').optional().isDate().withMessage('Valid coverage end date is required'),
  body('coverageDetails').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateInsurance = [
  body('providerName').optional().trim(),
  body('policyNumber').optional().trim(),
  body('policyHolderName').optional().trim(),
  body('relationshipToPatient').optional().trim(),
  body('coverageStartDate').optional().isDate().withMessage('Valid coverage start date is required'),
  body('coverageEndDate').optional().isDate().withMessage('Valid coverage end date is required'),
  body('coverageDetails').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetInsurance = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateInsurance,
  validateUpdateInsurance,
  validateGetInsurance,
};
