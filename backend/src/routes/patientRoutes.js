const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const {
  validateCreatePatient,
  validateUpdatePatient,
  validateGetPatients,
} = require('../validations/patient');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { uploadSingleDocument } = require('../middlewares/upload');

router.post('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), validateCreatePatient, patientController.createPatient);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'), validateGetPatients, patientController.getPatients);
router.get('/me', authenticateToken, authorizeRoles('Patient'), patientController.getMyProfile);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'), patientController.getPatientById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), validateUpdatePatient, patientController.updatePatient);
router.post('/:id/documents', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'), uploadSingleDocument, patientController.uploadPatientDocument);
router.get('/:id/documents', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse', 'Patient'), patientController.getPatientDocuments);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), patientController.deletePatient);

module.exports = router;
