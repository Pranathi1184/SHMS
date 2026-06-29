const { body, query, validationResult } = require('express-validator');

const validateCreateMedicine = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('genericName').optional().trim(),
  body('dosageForm').isIn(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Inhaler', 'Other']).withMessage('Invalid dosage form'),
  body('strength').trim().notEmpty().withMessage('Strength is required'),
  body('manufacturer').optional().trim(),
  body('batchNumber').optional().trim(),
  body('expiryDate').isDate().withMessage('Valid expiry date is required'),
  body('purchaseDate').optional().isDate().withMessage('Valid purchase date is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer'),
  body('description').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateMedicine = [
  body('name').optional().trim(),
  body('genericName').optional().trim(),
  body('dosageForm').optional().isIn(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Inhaler', 'Other']).withMessage('Invalid dosage form'),
  body('strength').optional().trim(),
  body('manufacturer').optional().trim(),
  body('batchNumber').optional().trim(),
  body('expiryDate').optional().isDate().withMessage('Valid expiry date is required'),
  body('purchaseDate').optional().isDate().withMessage('Valid purchase date is required'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer'),
  body('description').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetMedicines = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('lowStock').optional().isBoolean().withMessage('Low stock must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validatePharmacySale = [
  body('patientId').isUUID().withMessage('Valid patientId is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one sale item is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be >= 1'),
  body('items.*.medicineId').optional().isUUID().withMessage('medicineId must be a valid UUID'),
  body('items.*.name').optional().isString().trim().notEmpty().withMessage('name must be a non-empty string'),
  body('items.*').custom((item) => {
    if (!item.medicineId && !item.name) {
      throw new Error('Each sale item must include medicineId or name');
    }
    return true;
  }),
  body('notes').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateMedicine,
  validateUpdateMedicine,
  validateGetMedicines,
  validatePharmacySale,
};
