const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.get(
  '/summary',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff', 'Pharmacist'),
  analyticsController.getAnalyticsSummary
);

router.get(
  '/kpi-drilldown',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff', 'Receptionist', 'Doctor'),
  analyticsController.getKpiDrilldown
);

router.get(
  '/ml/no-show-risk',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist'),
  analyticsController.getNoShowRisk
);

router.get(
  '/ml/doctor-load-forecast',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Receptionist'),
  analyticsController.getDoctorLoadForecast
);

router.get(
  '/capacity-heatmap',
  authenticateToken,
  authorizeRoles('Administrator', 'Receptionist', 'Doctor'),
  analyticsController.getCapacityHeatmap
);

router.post(
  '/data-quality/run',
  authenticateToken,
  authorizeRoles('Administrator'),
  analyticsController.runDataQualityChecks
);

module.exports = router;
