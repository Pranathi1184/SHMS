const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const {
  validateCreatePrescription,
  validateUpdatePrescription,
  validateGetPrescriptions,
} = require('../validations/prescription');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Doctor'), validateCreatePrescription, prescriptionController.createPrescription);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Nurse', 'Patient'), validateGetPrescriptions, prescriptionController.getPrescriptions);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Nurse', 'Patient'), prescriptionController.getPrescriptionById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Pharmacist'), validateUpdatePrescription, prescriptionController.updatePrescription);
router.put('/:id/dispense', authenticateToken, authorizeRoles('Administrator', 'Pharmacist'), prescriptionController.dispensePrescription);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), prescriptionController.deletePrescription);

module.exports = router;
