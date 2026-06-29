const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { validateSchedulingQuery } = require('../validations/agent');

router.get(
  '/scheduling',
  authenticateToken,
  authorizeRoles('Administrator', 'Receptionist', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'),
  validateSchedulingQuery,
  agentController.getSchedulingSuggestions
);

router.get(
  '/history',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Billing Staff'),
  agentController.getAgentExecutionHistory
);

router.get(
  '/schedules',
  authenticateToken,
  authorizeRoles('Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Billing Staff'),
  agentController.getAgentSchedules
);

router.post(
  '/follow-up/trigger',
  authenticateToken,
  authorizeRoles('Administrator', 'Nurse', 'Doctor'),
  agentController.triggerFollowUpAgent
);

router.post(
  '/inventory/trigger',
  authenticateToken,
  authorizeRoles('Administrator', 'Pharmacist'),
  agentController.triggerInventoryAgent
);

router.post(
  '/billing/trigger',
  authenticateToken,
  authorizeRoles('Administrator', 'Billing Staff'),
  agentController.triggerBillingAgent
);

module.exports = router;
