const express = require('express');
const router = express.Router();
const ehrController = require('../controllers/ehrController');
const {
  validateCreateEHR,
  validateUpdateEHR,
  validateGetEHRs,
} = require('../validations/ehr');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Doctor'), validateCreateEHR, ehrController.createEHR);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Lab Technician', 'Pharmacist', 'Nurse'), validateGetEHRs, ehrController.getEHRs);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Lab Technician', 'Pharmacist', 'Nurse'), ehrController.getEHRById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor'), validateUpdateEHR, ehrController.updateEHR);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), ehrController.deleteEHR);

module.exports = router;
