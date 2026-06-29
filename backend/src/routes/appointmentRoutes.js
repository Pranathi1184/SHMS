const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const {
  validateCreateAppointment,
  validateUpdateAppointment,
  validateCheckAvailability,
  validateGetAvailableDoctors,
  validateFindBestSlots,
  validatePreVisitReadiness,
  validateGetAppointments,
} = require('../validations/appointment');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.get('/availability', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), validateCheckAvailability, appointmentController.checkAvailability);
router.get('/available-doctors', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), validateGetAvailableDoctors, appointmentController.getAvailableDoctors);
router.get('/slot-finder', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), validateFindBestSlots, appointmentController.findBestSlots);
router.get('/pre-visit-readiness', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), validatePreVisitReadiness, appointmentController.getPreVisitReadiness);
router.post('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), validateCreateAppointment, appointmentController.createAppointment);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'), validateGetAppointments, appointmentController.getAppointments);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'), appointmentController.getAppointmentById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), validateUpdateAppointment, appointmentController.updateAppointment);
router.put('/:id/cancel', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), appointmentController.cancelAppointment);

module.exports = router;
