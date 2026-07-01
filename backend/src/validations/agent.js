const { query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  return next();
};

const validateSchedulingQuery = [
  query('doctorId')
    .optional()
    .custom((value) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
      const isLicense = /^[A-Z]{2,5}-[A-Z0-9-]{2,}$/i.test(String(value || ''));
      if (!isUuid && !isLicense) {
        throw new Error('doctorId must be a valid UUID or doctor license number');
      }
      return true;
    }),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  handleValidation,
];

module.exports = {
  validateSchedulingQuery,
};
