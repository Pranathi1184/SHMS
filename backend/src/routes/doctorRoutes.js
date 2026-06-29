const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { validateCreateDoctor, validateGetDoctors, validateUpdateDoctorAvailability, validateUpdateDoctorClinicMode } = require('../validations/doctor');

router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'), validateGetDoctors, doctorController.getDoctors);
router.post('/', authenticateToken, authorizeRoles('Administrator', 'Receptionist'), validateCreateDoctor, doctorController.createDoctor);
router.put('/:id/availability', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist'), validateUpdateDoctorAvailability, doctorController.updateDoctorAvailability);
router.put('/:id/clinic-mode', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist'), validateUpdateDoctorClinicMode, doctorController.updateDoctorClinicMode);

module.exports = router;
