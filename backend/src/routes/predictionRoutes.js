const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// All prediction endpoints require authentication
router.use(authenticateToken);

// Get no-show predictions
// Accessible to: Administrator, Doctor, Receptionist
router.get(
  '/no-show',
  authorizeRoles('Administrator', 'Doctor', 'Receptionist'),
  predictionController.getNoShowPredictions
);

// Get doctor workload forecasts
// Accessible to: Administrator, Doctor
router.get(
  '/doctor-load',
  authorizeRoles('Administrator', 'Doctor'),
  predictionController.getDoctorLoadForecasts
);

// Get medicine demand forecasts
// Accessible to: Administrator, Pharmacist
router.get(
  '/medicine-demand',
  authorizeRoles('Administrator', 'Pharmacist'),
  predictionController.getMedicineDemandForecasts
);

// Get bed occupancy forecasts
// Accessible to: Administrator, Nurse
router.get(
  '/bed-occupancy',
  authorizeRoles('Administrator', 'Nurse'),
  predictionController.getBedOccupancyForecasts
);

// Get billing risk scores
// Accessible to: Administrator, Billing Staff
router.get(
  '/billing-risk',
  authorizeRoles('Administrator', 'Billing Staff'),
  predictionController.getBillingRiskScores
);

// Get prediction summary dashboard
// Accessible to: Administrator
router.get(
  '/summary',
  authorizeRoles('Administrator'),
  predictionController.getPredictionSummary
);

module.exports = router;
