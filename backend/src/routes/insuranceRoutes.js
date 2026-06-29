const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const {
  validateCreateInsurance,
  validateUpdateInsurance,
  validateGetInsurance,
} = require('../validations/insurance');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Receptionist', 'Billing Staff'), validateCreateInsurance, insuranceController.createInsurance);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Billing Staff', 'Nurse'), validateGetInsurance, insuranceController.getInsurance);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Billing Staff', 'Nurse'), insuranceController.getInsuranceById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Receptionist', 'Billing Staff'), validateUpdateInsurance, insuranceController.updateInsurance);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), insuranceController.deleteInsurance);

module.exports = router;
