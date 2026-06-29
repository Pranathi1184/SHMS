const cron = require('node-cron');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const db = require('../models');
const agentService = require('../services/agentService');
const { createNotificationsForUsers } = require('../services/notificationService');

let started = false;

const getSystemActor = async () => {
  const admin = await db.User.findOne({
    where: {
      role: 'Administrator',
      isActive: true,
    },
    order: [['createdAt', 'ASC']],
  });

  if (!admin) {
    return { id: null, role: 'Administrator' };
  }

  return { id: admin.id, role: admin.role };
};

const runAppointmentReminders = async () => {
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const appointments = await db.Appointment.findAll({
    where: {
      appointmentDate: {
        [Op.gte]: tomorrowStart,
        [Op.lt]: tomorrowEnd,
      },
      status: 'Scheduled',
    },
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
    ],
    limit: 500,
  });

  for (const appointment of appointments) {
    const user = appointment.patient?.email
      ? await db.User.findOne({ where: { email: appointment.patient.email, isActive: true } })
      : null;

    if (!user) continue;

    await createNotificationsForUsers([user.id], {
      title: 'Appointment Reminder',
      message: `Reminder: appointment with Dr. ${appointment.doctor?.user?.firstName || 'Doctor'} is tomorrow at ${appointment.startTime}.`,
      type: 'Appointment',
      relatedId: appointment.id,
    });
  }
};

const logScheduledAgentRun = async ({ actorId, agentName, status, result, error }) => {
  try {
    await db.AuditLog.create({
      actorUserId: actorId || null,
      action: `AGENT_${status}`,
      entityType: 'Agent',
      entityId: agentName,
      after: result || null,
      metadata: {
        triggerType: 'scheduled',
        status,
        error: error ? { message: error.message } : null,
      },
    });
  } catch (auditError) {
    logger.warn('Scheduled agent audit log failed', { agentName, message: auditError.message });
  }
};

const startAgentJobs = () => {
  if (started || process.env.NODE_ENV === 'test') {
    return;
  }
  started = true;

  const enabled = (process.env.ENABLE_AGENT_JOBS || 'true') === 'true';
  if (!enabled) {
    logger.info('Agent jobs are disabled by configuration');
    return;
  }

  // Follow-up every morning at 08:00
  cron.schedule(process.env.CRON_FOLLOW_UP || '0 8 * * *', async () => {
    try {
      const actor = await getSystemActor();
      const result = await agentService.runFollowUpAgent(actor);
      await logScheduledAgentRun({ actorId: actor.id, agentName: 'FollowUpAgent', status: 'SUCCESS', result });
      logger.info('Follow-up agent job completed');
    } catch (error) {
      await logScheduledAgentRun({ actorId: null, agentName: 'FollowUpAgent', status: 'FAILED', error });
      logger.error('Follow-up agent job failed', { message: error.message });
    }
  });

  // Inventory every night at 22:00
  cron.schedule(process.env.CRON_INVENTORY || '0 22 * * *', async () => {
    try {
      const actor = await getSystemActor();
      const result = await agentService.runInventoryAgent(actor);
      await logScheduledAgentRun({ actorId: actor.id, agentName: 'InventoryAgent', status: 'SUCCESS', result });
      logger.info('Inventory agent job completed');
    } catch (error) {
      await logScheduledAgentRun({ actorId: null, agentName: 'InventoryAgent', status: 'FAILED', error });
      logger.error('Inventory agent job failed', { message: error.message });
    }
  });

  // Billing every morning at 09:00
  cron.schedule(process.env.CRON_BILLING || '0 9 * * *', async () => {
    try {
      const actor = await getSystemActor();
      const result = await agentService.runBillingAgent(actor);
      await logScheduledAgentRun({ actorId: actor.id, agentName: 'BillingAgent', status: 'SUCCESS', result });
      logger.info('Billing agent job completed');
    } catch (error) {
      await logScheduledAgentRun({ actorId: null, agentName: 'BillingAgent', status: 'FAILED', error });
      logger.error('Billing agent job failed', { message: error.message });
    }
  });

  // Appointment reminders every morning at 07:00
  cron.schedule(process.env.CRON_APPOINTMENT_REMINDERS || '0 7 * * *', async () => {
    try {
      await runAppointmentReminders();
      logger.info('Appointment reminder job completed');
    } catch (error) {
      logger.error('Appointment reminder job failed', { message: error.message });
    }
  });

  logger.info('Agent and reminder cron jobs started');
};

module.exports = {
  startAgentJobs,
};
