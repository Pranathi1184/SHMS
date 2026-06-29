const { body, query, validationResult } = require('express-validator');

const validateCreateAppointment = [
  body('patientId').custom((value, { req }) => {
    if (req.user?.role === 'Patient') return true;
    if (!value) throw new Error('Patient ID is required');
    return true;
  }),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDate').isDate().withMessage('Valid appointment date is required'),
  body('startTime').isTime().withMessage('Valid start time is required'),
  body('endTime').isTime().withMessage('Valid end time is required'),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateAppointment = [
  body('appointmentDate').optional().isDate().withMessage('Valid appointment date is required'),
  body('startTime').optional().isTime().withMessage('Valid start time is required'),
  body('endTime').optional().isTime().withMessage('Valid end time is required'),
  body('status').optional().isIn(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']).withMessage('Invalid appointment status'),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateCheckAvailability = [
  query('doctorId').notEmpty().withMessage('Doctor ID is required'),
  query('date').isDate().withMessage('Valid date is required'),
  query('startTime').optional().isTime().withMessage('Valid start time is required'),
  query('endTime').optional().isTime().withMessage('Valid end time is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetAvailableDoctors = [
  query('date').isDate().withMessage('Valid date is required'),
  query('startTime').isTime().withMessage('Valid start time is required'),
  query('endTime').isTime().withMessage('Valid end time is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateFindBestSlots = [
  query('date').isDate().withMessage('Valid date is required'),
  query('fromTime').isTime().withMessage('Valid fromTime is required'),
  query('toTime').isTime().withMessage('Valid toTime is required'),
  query('durationMinutes').optional().isInt({ min: 10, max: 240 }).withMessage('Duration must be between 10 and 240 minutes'),
  query('departmentId').optional().trim(),
  query('preferredDoctorId').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validatePreVisitReadiness = [
  query('date').optional().isDate().withMessage('Valid date is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetAppointments = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']).withMessage('Invalid appointment status'),
  query('patientId').optional(),
  query('doctorId').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateAppointment,
  validateUpdateAppointment,
  validateCheckAvailability,
  validateGetAvailableDoctors,
  validateFindBestSlots,
  validatePreVisitReadiness,
  validateGetAppointments,
};
