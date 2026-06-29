const { body, query, validationResult } = require('express-validator');

// WARD VALIDATIONS
const validateCreateWard = [
  body('name').trim().notEmpty().withMessage('Ward name is required'),
  body('departmentId').notEmpty().withMessage('Department ID is required').isUUID().withMessage('Department ID must be a valid UUID'),
  body('type').isIn(['General', 'Private', 'Semi-Private', 'ICU', 'Emergency']).withMessage('Invalid ward type'),
  body('description').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateWard = [
  body('name').optional().trim(),
  body('departmentId').optional().isUUID().withMessage('Department ID must be a valid UUID'),
  body('type').optional().isIn(['General', 'Private', 'Semi-Private', 'ICU', 'Emergency']).withMessage('Invalid ward type'),
  body('description').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

// BED VALIDATIONS
const validateCreateBed = [
  body('wardId').notEmpty().withMessage('Ward ID is required').isUUID().withMessage('Ward ID must be a valid UUID'),
  body('bedNumber').trim().notEmpty().withMessage('Bed number is required'),
  body('status').optional().isIn(['Available', 'Occupied', 'Maintenance', 'Cleaning']).withMessage('Invalid bed status'),
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be a non-negative number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateBed = [
  body('wardId').optional().isUUID().withMessage('Ward ID must be a valid UUID'),
  body('bedNumber').optional().trim(),
  body('status').optional().isIn(['Available', 'Occupied', 'Maintenance', 'Cleaning']).withMessage('Invalid bed status'),
  body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Price per day must be a non-negative number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

// ADMISSION VALIDATIONS
const validateCreateAdmission = [
  body('patientId').notEmpty().withMessage('Patient ID is required').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required').isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('bedId').notEmpty().withMessage('Bed ID is required').isUUID().withMessage('Bed ID must be a valid UUID'),
  body('reasonForAdmission').trim().notEmpty().withMessage('Reason for admission is required'),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateAdmission = [
  body('doctorId').optional().isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('bedId').optional().isUUID().withMessage('Bed ID must be a valid UUID'),
  body('reasonForAdmission').optional().trim(),
  body('status').optional().isIn(['Admitted', 'Discharged', 'Transferred']).withMessage('Invalid admission status'),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetAdmissions = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  query('doctorId').optional().isUUID().withMessage('doctorId must be a valid UUID'),
  query('status').optional().isIn(['Admitted', 'Discharged', 'Transferred']).withMessage('Invalid admission status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateWard,
  validateUpdateWard,
  validateCreateBed,
  validateUpdateBed,
  validateCreateAdmission,
  validateUpdateAdmission,
  validateGetAdmissions,
};
