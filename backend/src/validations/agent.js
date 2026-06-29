const { query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  return next();
};

const validateSchedulingQuery = [
  query('doctorId').optional().isUUID().withMessage('doctorId must be a valid UUID'),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  handleValidation,
];

module.exports = {
  validateSchedulingQuery,
};
