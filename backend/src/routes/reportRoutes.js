const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// All report routes require Administrator or specific manager roles
router.get(
  '/revenue',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff', 'Receptionist'),
  reportController.getRevenueStats
);

router.get(
  '/patients',
  authenticateToken,
  authorizeRoles('Administrator', 'Receptionist', 'Doctor', 'Nurse'),
  reportController.getPatientStats
);

router.get(
  '/departments',
  authenticateToken,
  authorizeRoles('Administrator', 'Receptionist', 'Doctor'),
  reportController.getDepartmentStats
);

router.get(
  '/occupancy',
  authenticateToken,
  authorizeRoles('Administrator', 'Nurse', 'Receptionist', 'Doctor'),
  reportController.getOccupancyStats
);

router.get(
  '/inventory',
  authenticateToken,
  authorizeRoles('Administrator', 'Pharmacist'),
  reportController.getInventoryAlerts
);

router.get(
  '/export/:type',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff'),
  reportController.exportReportCSV
);

router.get(
  '/reconciliation',
  authenticateToken,
  authorizeRoles('Administrator'),
  reportController.runDataReconciliation
);

module.exports = router;
