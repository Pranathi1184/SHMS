const express = require('express');
const router = express.Router();
const laboratoryTestController = require('../controllers/laboratoryTestController');
const {
  validateCreateLabTest,
  validateUpdateLabTest,
  validateGetLabTests,
} = require('../validations/laboratoryTest');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Doctor'), validateCreateLabTest, laboratoryTestController.createLabTest);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Nurse'), validateGetLabTests, laboratoryTestController.getLabTests);
router.get('/:id/report', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Lab Technician', 'Nurse'), laboratoryTestController.generateLabReport);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Nurse'), laboratoryTestController.getLabTestById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Lab Technician'), validateUpdateLabTest, laboratoryTestController.updateLabTest);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), laboratoryTestController.deleteLabTest);

module.exports = router;
