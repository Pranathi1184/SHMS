const logger = require('../utils/logger');
const agentService = require('../services/agentService');
const db = require('../models');

const AGENT_CRON_DEFAULTS = {
  followUp: '0 8 * * *',
  inventory: '0 22 * * *',
  billing: '0 9 * * *',
  appointmentReminders: '0 7 * * *',
};

const sendAgentError = (res, operation, error) => {
  logger.error(`${operation} agent error`, {
    message: error.message,
    stack: error.stack,
  });
  return res.status(500).json({ status: 'error', message: `${operation} agent failed` });
};

const logAgentRun = async ({ req, agentName, triggerType, status, result, error }) => {
  try {
    await db.AuditLog.create({
      actorUserId: req.user?.id || null,
      action: `AGENT_${status}`,
      entityType: 'Agent',
      entityId: agentName,
      after: result || null,
      metadata: {
        triggerType,
        role: req.user?.role,
        status,
        error: error ? { message: error.message } : null,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch (auditError) {
    logger.warn('Failed to write agent audit log', { message: auditError.message, agentName });
  }
};

const getSchedulingSuggestions = async (req, res) => {
  try {
    let { doctorId } = req.query;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    if (req.user.role === 'Doctor') {
      const doctorProfile = await db.Doctor.findOne({ where: { userId: req.user.id } });
      if (doctorProfile) {
        doctorId = doctorProfile.id;
      }
    }

    const result = await agentService.runSchedulingAgent(doctorId, date, req.user);
    await logAgentRun({ req, agentName: 'SchedulingAgent', triggerType: 'manual', status: 'SUCCESS', result });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    await logAgentRun({ req, agentName: 'SchedulingAgent', triggerType: 'manual', status: 'FAILED', error });
    return sendAgentError(res, 'Scheduling', error);
  }
};

const triggerFollowUpAgent = async (req, res) => {
  try {
    const result = await agentService.runFollowUpAgent(req.user);
    await logAgentRun({ req, agentName: 'FollowUpAgent', triggerType: 'manual', status: 'SUCCESS', result });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    await logAgentRun({ req, agentName: 'FollowUpAgent', triggerType: 'manual', status: 'FAILED', error });
    return sendAgentError(res, 'Follow-up', error);
  }
};

const triggerInventoryAgent = async (req, res) => {
  try {
    const result = await agentService.runInventoryAgent(req.user);
    await logAgentRun({ req, agentName: 'InventoryAgent', triggerType: 'manual', status: 'SUCCESS', result });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    await logAgentRun({ req, agentName: 'InventoryAgent', triggerType: 'manual', status: 'FAILED', error });
    return sendAgentError(res, 'Inventory', error);
  }
};

const triggerBillingAgent = async (req, res) => {
  try {
    const result = await agentService.runBillingAgent(req.user);
    await logAgentRun({ req, agentName: 'BillingAgent', triggerType: 'manual', status: 'SUCCESS', result });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    await logAgentRun({ req, agentName: 'BillingAgent', triggerType: 'manual', status: 'FAILED', error });
    return sendAgentError(res, 'Billing', error);
  }
};

const getAgentExecutionHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const rows = await db.AuditLog.findAll({
      where: { entityType: 'Agent' },
      include: [{ model: db.User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit,
    });

    res.status(200).json({ status: 'success', data: { executions: rows } });
  } catch (error) {
    return sendAgentError(res, 'Agent history', error);
  }
};

const getAgentSchedules = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        enabled: (process.env.ENABLE_AGENT_JOBS || 'true') === 'true',
        schedules: {
          followUp: process.env.CRON_FOLLOW_UP || AGENT_CRON_DEFAULTS.followUp,
          inventory: process.env.CRON_INVENTORY || AGENT_CRON_DEFAULTS.inventory,
          billing: process.env.CRON_BILLING || AGENT_CRON_DEFAULTS.billing,
          appointmentReminders: process.env.CRON_APPOINTMENT_REMINDERS || AGENT_CRON_DEFAULTS.appointmentReminders,
        },
      },
    });
  } catch (error) {
    return sendAgentError(res, 'Agent schedules', error);
  }
};

module.exports = {
  getSchedulingSuggestions,
  triggerFollowUpAgent,
  triggerInventoryAgent,
  triggerBillingAgent,
  getAgentExecutionHistory,
  getAgentSchedules,
};
