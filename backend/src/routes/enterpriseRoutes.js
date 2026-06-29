const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterpriseController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post(
  '/claims',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff', 'Receptionist'),
  enterpriseController.createClaim
);

router.get(
  '/claims',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff', 'Receptionist', 'Doctor'),
  enterpriseController.listClaims
);

router.patch(
  '/claims/:id/status',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff'),
  enterpriseController.updateClaimStatus
);

router.post(
  '/discharge-pathways',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist'),
  enterpriseController.createOrUpdateDischargePathway
);

router.get(
  '/discharge-pathways',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist'),
  enterpriseController.listDischargePathways
);

router.post(
  '/communications/send',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff', 'Lab Technician', 'Pharmacist'),
  enterpriseController.sendPatientCommunication
);

router.get(
  '/communications',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff'),
  enterpriseController.listCommunications
);

module.exports = router;
