const { body, query, validationResult } = require('express-validator');

const validateCreateLabTest = [
  body('patientId').notEmpty().withMessage('Patient ID is required').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required').isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('testName').trim().notEmpty().withMessage('Test name is required'),
  body('testCode').optional().trim(),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateLabTest = [
  body('status').optional().isIn(['Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid test status'),
  body('results').optional(),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetLabTests = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  query('doctorId').optional().isUUID().withMessage('doctorId must be a valid UUID'),
  query('status').optional().isIn(['Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid test status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateLabTest,
  validateUpdateLabTest,
  validateGetLabTests,
};
