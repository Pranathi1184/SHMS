const { body, query, validationResult } = require('express-validator');

const toMinutes = (value) => {
  if (!value || !String(value).includes(':')) return NaN;
  const [hours, minutes] = String(value).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return (hours * 60) + minutes;
};

const validateCreateDoctor = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }),
  body('departmentId').notEmpty().withMessage('Department is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required').isLength({ max: 255 }),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required').isLength({ max: 100 }),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a valid amount'),
  body('password').trim().notEmpty().withMessage('Password is required').isLength({ min: 6 }),
  body('availableFrom').optional().isTime().withMessage('Available from must be a valid time'),
  body('availableTo').optional().isTime().withMessage('Available to must be a valid time'),
  body('slotDurationMinutes').optional().isInt({ min: 10, max: 240 }).withMessage('Slot duration must be between 10 and 240 minutes'),
  body('availableDays').optional().isArray().withMessage('Available days must be an array'),
  body('availableDays.*').optional().isInt({ min: 0, max: 6 }).withMessage('Available day must be between 0 and 6'),
  body('availableTo').optional().custom((availableTo, { req }) => {
    if (!req.body.availableFrom || !availableTo) return true;
    return toMinutes(availableTo) > toMinutes(req.body.availableFrom);
  }).withMessage('Available to must be later than available from'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateDoctorAvailability = [
  body('availableFrom').notEmpty().withMessage('Available from is required').isTime().withMessage('Available from must be a valid time'),
  body('availableTo').notEmpty().withMessage('Available to is required').isTime().withMessage('Available to must be a valid time'),
  body('slotDurationMinutes').notEmpty().withMessage('Slot duration is required').isInt({ min: 10, max: 240 }).withMessage('Slot duration must be between 10 and 240 minutes'),
  body('availableDays').isArray({ min: 1 }).withMessage('At least one available day is required'),
  body('availableDays.*').isInt({ min: 0, max: 6 }).withMessage('Available day must be between 0 and 6'),
  body('availableTo').custom((availableTo, { req }) => toMinutes(availableTo) > toMinutes(req.body.availableFrom)).withMessage('Available to must be later than available from'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateDoctorClinicMode = [
  body('runningLate').isBoolean().withMessage('runningLate must be true or false'),
  body('delayMinutes').optional().isInt({ min: 0, max: 180 }).withMessage('delayMinutes must be between 0 and 180'),
  body('date').optional().isDate().withMessage('date must be a valid date'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetDoctors = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('departmentId').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateDoctor,
  validateGetDoctors,
  validateUpdateDoctorAvailability,
  validateUpdateDoctorClinicMode,
};
