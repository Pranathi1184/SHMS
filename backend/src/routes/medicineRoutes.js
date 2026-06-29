const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const {
  validateCreateMedicine,
  validateUpdateMedicine,
  validateGetMedicines,
  validatePharmacySale,
} = require('../validations/medicine');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Pharmacist'), validateCreateMedicine, medicineController.createMedicine);
router.post('/sales', authenticateToken, authorizeRoles('Administrator', 'Pharmacist', 'Billing Staff'), validatePharmacySale, medicineController.createPharmacySale);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Nurse', 'Billing Staff'), validateGetMedicines, medicineController.getMedicines);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Nurse', 'Billing Staff'), medicineController.getMedicineById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Pharmacist'), validateUpdateMedicine, medicineController.updateMedicine);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), medicineController.deleteMedicine);

module.exports = router;
