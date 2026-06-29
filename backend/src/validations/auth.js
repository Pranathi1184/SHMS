const { body, validationResult } = require('express-validator');

const normalizeRole = (role) => {
  if (!role) return 'Patient';
  if (role === 'Admin') return 'Administrator';
  return role;
};

const validateRegistration = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['Administrator', 'Admin', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'])
    .withMessage('Invalid role'),
  body('phone').custom((value, { req }) => {
    if (normalizeRole(req.body.role) !== 'Patient') return true;
    if (!value) throw new Error('Phone is required for patient registration');
    return true;
  }),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('dateOfBirth').custom((value, { req }) => {
    if (normalizeRole(req.body.role) !== 'Patient') return true;
    if (!value) throw new Error('Date of birth is required for patient registration');
    return true;
  }),
  body('dateOfBirth').optional().isDate().withMessage('Valid date of birth is required'),
  body('gender').custom((value, { req }) => {
    if (normalizeRole(req.body.role) !== 'Patient') return true;
    if (!value) throw new Error('Gender is required for patient registration');
    return true;
  }),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
};
