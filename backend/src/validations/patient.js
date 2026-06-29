const { body, query, validationResult } = require('express-validator');

const validateCreatePatient = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('dateOfBirth').isDate().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdatePatient = [
  body('firstName').optional().trim().isLength({ max: 100 }),
  body('lastName').optional().trim().isLength({ max: 100 }),
  body('dateOfBirth').optional().isDate().withMessage('Valid date of birth is required'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetPatients = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),
  query('search').optional().trim(),
  query('gender').optional().trim(),
  query('bloodType').optional().trim(),
  query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'dateOfBirth']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Invalid sort order'),
  (req, res, next) => {
    // Validate gender if provided and not empty
    if (req.query.gender && req.query.gender !== '' && !['Male', 'Female', 'Other'].includes(req.query.gender)) {
      return res.status(400).json({ status: 'error', message: 'Invalid gender filter' });
    }
    // Validate bloodType if provided and not empty
    if (req.query.bloodType && req.query.bloodType !== '' && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(req.query.bloodType)) {
      return res.status(400).json({ status: 'error', message: 'Invalid blood type filter' });
    }
    next();
  },
];

module.exports = {
  validateCreatePatient,
  validateUpdatePatient,
  validateGetPatients,
};
