const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const {
  validateCreateBill,
  validateUpdateBill,
  validateGetBills,
} = require('../validations/bill');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Receptionist', 'Billing Staff'), validateCreateBill, billController.createBill);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Billing Staff', 'Nurse'), validateGetBills, billController.getBills);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Billing Staff', 'Nurse'), billController.getBillById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Receptionist', 'Billing Staff'), validateUpdateBill, billController.updateBill);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), billController.deleteBill);

module.exports = router;
