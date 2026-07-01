const { body, query, validationResult } = require('express-validator');

const ensureValidTimeRange = (startField, endField, source = 'body') => (req, res, next) => {
  const start = source === 'query' ? req.query[startField] : req.body[startField];
  const end = source === 'query' ? req.query[endField] : req.body[endField];

  if (!start || !end) {
    return next();
  }

  if (String(end) <= String(start)) {
    return res.status(400).json({
      status: 'error',
      errors: [{ msg: `${endField} must be later than ${startField}` }],
    });
  }

  return next();
};

const validateCreateAppointment = [
  body('patientId').custom((value, { req }) => {
    if (req.user?.role === 'Patient') return true;
    if (!value) throw new Error('Patient ID is required');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
    if (!isUuid) throw new Error('Patient ID must be a valid UUID');
    return true;
  }),
  body('doctorId').notEmpty().withMessage('Doctor ID is required').isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('appointmentDate').isDate().withMessage('Valid appointment date is required'),
  body('startTime').isTime().withMessage('Valid start time is required'),
  body('endTime').isTime().withMessage('Valid end time is required'),
  body('notes').optional().trim(),
  ensureValidTimeRange('startTime', 'endTime', 'body'),
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
  ensureValidTimeRange('startTime', 'endTime', 'body'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateCheckAvailability = [
  query('doctorId').notEmpty().withMessage('Doctor ID is required').isUUID().withMessage('Doctor ID must be a valid UUID'),
  query('date').isDate().withMessage('Valid date is required'),
  query('startTime').optional().isTime().withMessage('Valid start time is required'),
  query('endTime').optional().isTime().withMessage('Valid end time is required'),
  ensureValidTimeRange('startTime', 'endTime', 'query'),
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
  ensureValidTimeRange('startTime', 'endTime', 'query'),
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
