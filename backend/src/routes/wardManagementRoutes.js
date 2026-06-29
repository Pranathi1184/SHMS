const express = require('express');
const router = express.Router();
const wardManagementController = require('../controllers/wardManagementController');
const {
  validateCreateWard,
  validateUpdateWard,
  validateCreateBed,
  validateUpdateBed,
  validateCreateAdmission,
  validateUpdateAdmission,
  validateGetAdmissions,
} = require('../validations/wardManagement');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// WARD ROUTES
router.post('/wards', authenticateToken, authorizeRoles('Administrator'), validateCreateWard, wardManagementController.createWard);
router.get('/wards', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), wardManagementController.getWards);
router.get('/wards/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), wardManagementController.getWardById);
router.put('/wards/:id', authenticateToken, authorizeRoles('Administrator'), validateUpdateWard, wardManagementController.updateWard);
router.delete('/wards/:id', authenticateToken, authorizeRoles('Administrator'), wardManagementController.deleteWard);

// BED ROUTES
router.post('/beds', authenticateToken, authorizeRoles('Administrator', 'Receptionist', 'Nurse'), validateCreateBed, wardManagementController.createBed);
router.get('/beds', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), wardManagementController.getBeds);
router.get('/beds/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), wardManagementController.getBedById);
router.put('/beds/:id', authenticateToken, authorizeRoles('Administrator', 'Receptionist', 'Nurse'), validateUpdateBed, wardManagementController.updateBed);
router.delete('/beds/:id', authenticateToken, authorizeRoles('Administrator'), wardManagementController.deleteBed);

// ADMISSION ROUTES
router.post('/admissions', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), validateCreateAdmission, wardManagementController.createAdmission);
router.get('/admissions', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Billing Staff', 'Nurse'), validateGetAdmissions, wardManagementController.getAdmissions);
router.get('/admissions/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Billing Staff', 'Nurse'), wardManagementController.getAdmissionById);
router.put('/admissions/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), validateUpdateAdmission, wardManagementController.updateAdmission);
router.put('/admissions/:id/discharge', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse'), wardManagementController.dischargePatient);
router.delete('/admissions/:id', authenticateToken, authorizeRoles('Administrator'), wardManagementController.deleteAdmission);

module.exports = router;
