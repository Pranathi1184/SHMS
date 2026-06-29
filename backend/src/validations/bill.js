const { body, query, validationResult } = require('express-validator');

const validateCreateBill = [
  body('patientId').notEmpty().withMessage('Patient ID is required').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('billNumber').trim().notEmpty().withMessage('Bill number is required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
  body('paymentMode').optional().isIn(['Cash', 'Card', 'UPI', 'Insurance', 'Net Banking', 'Other']).withMessage('Invalid payment mode'),
  body('paymentStatus').optional().isIn(['Pending', 'Partially Paid', 'Paid', 'Cancelled']).withMessage('Invalid payment status'),
  body('insuranceId').optional().isUUID().withMessage('Insurance ID must be a valid UUID'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one bill item is required'),
  body('items.*.description').trim().notEmpty().withMessage('Description is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1 for each item'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number for each item'),
  body('items.*.totalPrice').optional().isFloat({ min: 0 }).withMessage('Total price must be a non-negative number for each item'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateUpdateBill = [
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
  body('paymentMode').optional().isIn(['Cash', 'Card', 'UPI', 'Insurance', 'Net Banking', 'Other']).withMessage('Invalid payment mode'),
  body('paymentStatus').optional().isIn(['Pending', 'Partially Paid', 'Paid', 'Cancelled']).withMessage('Invalid payment status'),
  body('insuranceId').optional().isUUID().withMessage('Insurance ID must be a valid UUID'),
  body('notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

const validateGetBills = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),
  query('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  query('paymentStatus').optional().isIn(['Pending', 'Partially Paid', 'Paid', 'Cancelled']).withMessage('Invalid payment status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateCreateBill,
  validateUpdateBill,
  validateGetBills,
};
