const { StateGraph, Annotation, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { agentPrompts } = require('../prompts/agentPrompts');
const { createNotificationsForUsers } = require('./notificationService');

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const model = new ChatOpenAI({
  modelName: GROQ_MODEL,
  apiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: 'https://api.groq.com/openai/v1',
  },
});

const AGENT_RETRY_ATTEMPTS = Number(process.env.AGENT_RETRY_ATTEMPTS || 3);
const AGENT_RETRY_DELAY_MS = Number(process.env.AGENT_RETRY_DELAY_MS || 500);
const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getActiveUsersForPatients = async (patientIds = []) => {
  const uniquePatientIds = [...new Set(patientIds.filter(Boolean))];
  if (!uniquePatientIds.length) return [];

  const patients = await db.Patient.findAll({
    where: { id: uniquePatientIds },
    attributes: ['id', 'email'],
  });

  const emailToPatientId = new Map();
  const emails = [];
  for (const p of patients) {
    if (p.email) {
      emails.push(p.email);
      emailToPatientId.set(p.email, p.id);
    }
  }

  if (!emails.length) return [];

  const users = await db.User.findAll({
    where: {
      email: { [Op.in]: emails },
      isActive: true,
    },
    attributes: ['id', 'email'],
  });

  return users.map((u) => ({ userId: u.id, patientId: emailToPatientId.get(u.email) }));
};

const fallbackAgentMessage = (label) => {
  switch (label) {
    case 'scheduling':
      return 'Scheduling suggestions are unavailable because GROQ_API_KEY is not configured.';
    case 'followUp':
      return 'Follow-up message generation is unavailable because GROQ_API_KEY is not configured.';
    case 'inventory':
      return 'Inventory recommendations are unavailable because GROQ_API_KEY is not configured.';
    case 'billing':
      return 'Billing insights are unavailable because GROQ_API_KEY is not configured.';
    default:
      return 'Agent response unavailable: GROQ_API_KEY is not configured.';
  }
};

const invokeWithRetry = async (prompt, label) => {
  if (!hasGroqKey) {
    logger.warn('Agent fallback response returned: missing GROQ_API_KEY', { label });
    return { content: fallbackAgentMessage(label) };
  }

  let lastError;
  for (let attempt = 1; attempt <= AGENT_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await model.invoke(prompt);
      logger.info('Agent model invocation succeeded', { label, attempt });
      return response;
    } catch (error) {
      lastError = error;
      logger.warn('Agent model invocation failed', {
        label,
        attempt,
        maxAttempts: AGENT_RETRY_ATTEMPTS,
        message: error.message,
      });
      if (attempt < AGENT_RETRY_ATTEMPTS) {
        await sleep(AGENT_RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`Agent invocation failed for ${label}: ${lastError?.message || 'Unknown error'}`);
};

const SchedulingState = Annotation.Root({
  doctorId: Annotation({
    reducer: (_, value) => value,
    default: () => null,
  }),
  date: Annotation({
    reducer: (_, value) => value,
    default: () => null,
  }),
  availableSlots: Annotation({
    reducer: (_, value) => value,
    default: () => [],
  }),
  suggestions: Annotation({
    reducer: (_, value) => value,
    default: () => '',
  }),
});

const FollowUpState = Annotation.Root({
  dischargedPatients: Annotation({
    reducer: (_, value) => value,
    default: () => [],
  }),
  followUpMessages: Annotation({
    reducer: (_, value) => value,
    default: () => [],
  }),
});

const InventoryState = Annotation.Root({
  lowStock: Annotation({
    reducer: (_, value) => value,
    default: () => [],
  }),
  recommendations: Annotation({
    reducer: (_, value) => value,
    default: () => '',
  }),
});

const BillingState = Annotation.Root({
  pendingBills: Annotation({
    reducer: (_, value) => value,
    default: () => [],
  }),
  billingInsights: Annotation({
    reducer: (_, value) => value,
    default: () => '',
  }),
});

/**
 * 1. Smart Scheduling Agent
 */
const runSchedulingAgent = async (doctorId, date, actor = {}, operatorContext = '') => {
  logger.info('Scheduling agent started', { doctorId, date, role: actor.role, userId: actor.id, hasContext: Boolean(String(operatorContext || '').trim()) });
  try {
    const workflow = new StateGraph(SchedulingState);

    workflow.addNode('fetch_availability', async (state) => {
      const where = {
        appointmentDate: state.date,
        status: { [Op.ne]: 'Cancelled' },
      };
      if (state.doctorId) {
        where.doctorId = state.doctorId;
      }

      const appointments = await db.Appointment.findAll({
        where,
        include: state.doctorId
          ? []
          : [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }],
      });

      const booked = appointments.map((a) => {
        const slot = `${a.startTime}-${a.endTime}`;
        if (state.doctorId) return slot;
        const doctorName = `${a.doctor?.user?.firstName || ''} ${a.doctor?.user?.lastName || ''}`.trim() || a.doctorId;
        return `${doctorName}: ${slot}`;
      });

      return { ...state, availableSlots: booked };
    });

    workflow.addNode('suggest_slots', async (state) => {
      const prompt = `Viewer role: ${actor.role || 'User'}\nViewer userId: ${actor.id || 'N/A'}\nOperator context: ${String(operatorContext || '').trim() || 'None provided'}\n` + agentPrompts.scheduling(state.date, state.availableSlots, actor.role || 'User', String(operatorContext || '').trim());
      const response = await invokeWithRetry(prompt, 'scheduling');
      return { ...state, suggestions: response.content };
    });

    workflow.setEntryPoint('fetch_availability');
    workflow.addEdge('fetch_availability', 'suggest_slots');
    workflow.addEdge('suggest_slots', END);

    const app = workflow.compile();
    const result = await app.invoke({ doctorId, date });
    logger.info('Scheduling agent completed', { doctorId, date, role: actor.role, userId: actor.id, hasContext: Boolean(String(operatorContext || '').trim()) });
    return result;
  } catch (error) {
    logger.warn('Scheduling agent fallback used', { doctorId, date, role: actor.role, userId: actor.id, hasContext: Boolean(String(operatorContext || '').trim()), message: error.message });
    const where = {
      appointmentDate: date,
      status: { [Op.ne]: 'Cancelled' },
    };
    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await db.Appointment.findAll({
      where,
      include: doctorId
        ? []
        : [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }],
    });

    const booked = appointments.map((a) => {
      const slot = `${a.startTime}-${a.endTime}`;
      if (doctorId) return slot;
      const doctorName = `${a.doctor?.user?.firstName || ''} ${a.doctor?.user?.lastName || ''}`.trim() || a.doctorId;
      return `${doctorName}: ${slot}`;
    });

    return {
      doctorId,
      date,
      availableSlots: booked,
      appliedContext: String(operatorContext || '').trim() || null,
      suggestions: booked.length === 0
        ? 'The schedule is open. Prioritize morning appointments and leave one buffer slot.'
        : `Booked slots: ${booked.join(', ')}. Prefer open gaps before 11:00 or after 15:00 and keep one emergency slot free.`,
    };
  }
};

/**
 * 2. Follow-Up Agent
 */
const runFollowUpAgent = async (actor = {}, operatorContext = '') => {
  logger.info('Follow-up agent started', { role: actor.role, userId: actor.id, hasContext: Boolean(String(operatorContext || '').trim()) });
  try {
    const workflow = new StateGraph(FollowUpState);

    workflow.addNode('fetch_discharges', async (state) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const where = {
        status: 'Discharged',
        dischargeDate: { [Op.gte]: yesterday },
      };

      if (actor.role === 'Doctor') {
        const doctor = await db.Doctor.findOne({ where: { userId: actor.id } });
        if (doctor) {
          where.doctorId = doctor.id;
        }
      }

      const admissions = await db.Admission.findAll({
        where,
        include: [{ model: db.Patient, as: 'patient' }],
      });
      return { ...state, dischargedPatients: admissions };
    });

    workflow.addNode('generate_reminders', async (state) => {
      const reminders = [];
      for (const adm of state.dischargedPatients) {
        const patientName = adm.patient?.firstName || adm.patient?.fullName || 'Patient';
        const prompt = `Viewer role: ${actor.role || 'User'}\nOperator context: ${String(operatorContext || '').trim() || 'None provided'}\n` + agentPrompts.followUp(patientName, adm.reasonForAdmission, actor.role || 'User');
        const response = await invokeWithRetry(prompt, 'followUp');
        const patientId = adm.patient?.id || adm.patientId || adm.id || null;
        reminders.push({ patientId, message: response.content });
      }

      const mappings = await getActiveUsersForPatients(reminders.map((r) => r.patientId));
      const byPatient = new Map(reminders.map((r) => [r.patientId, r.message]));
      for (const mapItem of mappings) {
        const msg = byPatient.get(mapItem.patientId);
        if (!msg) continue;
        await createNotificationsForUsers([mapItem.userId], {
          title: 'Follow-up Reminder',
          message: msg,
          type: 'FollowUp',
        });
      }

      return { ...state, followUpMessages: reminders };
    });

    workflow.setEntryPoint('fetch_discharges');
    workflow.addEdge('fetch_discharges', 'generate_reminders');
    workflow.addEdge('generate_reminders', END);

    const app = workflow.compile();
    const result = await app.invoke({});
    logger.info('Follow-up agent completed', { generatedMessages: result.followUpMessages?.length || 0, role: actor.role, userId: actor.id });
    return {
      ...result,
      appliedContext: String(operatorContext || '').trim() || null,
    };
  } catch (error) {
    logger.warn('Follow-up agent fallback used', { role: actor.role, userId: actor.id, message: error.message });
    const fallbackWhere = { status: 'Discharged' };
    if (actor.role === 'Doctor') {
      const doctor = await db.Doctor.findOne({ where: { userId: actor.id } });
      if (doctor) {
        fallbackWhere.doctorId = doctor.id;
      }
    }
    const admissions = await db.Admission.findAll({
      where: fallbackWhere,
      include: [{ model: db.Patient, as: 'patient' }],
      limit: 5,
    });
    const followUpMessages = admissions.map((adm) => ({
      patientId: adm.patient?.id,
      message: `Follow up with ${adm.patient?.firstName || 'patient'} about ${adm.reasonForAdmission || 'recent discharge'}.`,
    }));
    return {
      dischargedPatients: admissions,
      followUpMessages,
      appliedContext: String(operatorContext || '').trim() || null,
    };
  }
};

/**
 * 3. Inventory Agent
 */
const runInventoryAgent = async (actor = {}, operatorContext = '') => {
  logger.info('Inventory agent started', { role: actor.role, userId: actor.id, hasContext: Boolean(String(operatorContext || '').trim()) });
  try {
    const workflow = new StateGraph(InventoryState);

    workflow.addNode('check_stock', async (state) => {
      const meds = await db.Medicine.findAll({
        where: {
          quantity: { [Op.lte]: db.sequelize.col('reorder_level') },
        },
      });
      return { ...state, lowStock: meds };
    });

    workflow.addNode('generate_order_plan', async (state) => {
      if (state.lowStock.length === 0) return { ...state, recommendations: 'Stock levels are healthy.' };
      const medicineIds = state.lowStock.map((m) => m.id);
      const since = new Date(Date.now() - (1000 * 60 * 60 * 24 * 30));
      const usageRows = await db.PrescriptionItem.findAll({
        attributes: ['medicineId', [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'usageQty']],
        where: {
          medicineId: { [Op.in]: medicineIds },
          createdAt: { [Op.gte]: since },
        },
        group: ['medicineId'],
        raw: true,
      });

      const usageMap = new Map(usageRows.map((r) => [r.medicineId, Number(r.usageQty || 0)]));
      const medList = state.lowStock
        .map((m) => {
          const monthlyUsage = usageMap.get(m.id) || 0;
          const projected30Day = Math.ceil(monthlyUsage * 1.2);
          return `${m.name} (Current: ${m.quantity}, Min: ${m.reorderLevel}, Last30DayUsage: ${monthlyUsage}, ProjectedNeed30Day: ${projected30Day})`;
        })
        .join(', ');
      const prompt = `Viewer role: ${actor.role || 'User'}\nOperator context: ${String(operatorContext || '').trim() || 'None provided'}\n` + agentPrompts.inventoryPlan(medList, actor.role || 'User');
      const response = await invokeWithRetry(prompt, 'inventory');
      return { ...state, recommendations: response.content };
    });

    workflow.setEntryPoint('check_stock');
    workflow.addEdge('check_stock', 'generate_order_plan');
    workflow.addEdge('generate_order_plan', END);

    const app = workflow.compile();
    const result = await app.invoke({});
    logger.info('Inventory agent completed', { lowStockCount: result.lowStock?.length || 0, role: actor.role, userId: actor.id });
    return {
      ...result,
      appliedContext: String(operatorContext || '').trim() || null,
    };
  } catch (error) {
    logger.warn('Inventory agent fallback used', { role: actor.role, userId: actor.id, message: error.message });
    const lowStock = await db.Medicine.findAll({
      where: { quantity: { [Op.lte]: db.sequelize.col('reorder_level') } },
      limit: 10,
    });
    return {
      lowStock,
      recommendations: lowStock.length === 0
        ? 'Stock levels are healthy.'
        : `Review ${lowStock.length} medicines that are at or below reorder level.`,
      appliedContext: String(operatorContext || '').trim() || null,
    };
  }
};

/**
 * 4. Billing Agent
 */
const runBillingAgent = async (actor = {}, operatorContext = '') => {
  logger.info('Billing agent started', { role: actor.role, userId: actor.id, hasContext: Boolean(String(operatorContext || '').trim()) });
  try {
    const workflow = new StateGraph(BillingState);

    workflow.addNode('fetch_pending', async (state) => {
      const bills = await db.Bill.findAll({
        where: { paymentStatus: 'Pending' },
        include: [{ model: db.Patient, as: 'patient' }],
      });
      return { ...state, pendingBills: bills };
    });

    workflow.addNode('analyze_and_remind', async (state) => {
      const totalPending = state.pendingBills.reduce((sum, b) => sum + parseFloat(b.netAmount), 0);
      const sampleItems = state.pendingBills
        .slice(0, 5)
        .map((bill) => `${bill.billNumber || bill.id}:$${parseFloat(bill.netAmount || 0).toFixed(2)}:${bill.patient?.firstName || 'Patient'}`)
        .join('; ');
      const prompt = `Viewer role: ${actor.role || 'User'}\nOperator context: ${String(operatorContext || '').trim() || 'None provided'}\n` + agentPrompts.billingReminder(
        state.pendingBills.length,
        Number(totalPending.toFixed(2)),
        actor.role || 'User',
        sampleItems
      );
      const response = await invokeWithRetry(prompt, 'billing');

      const mappings = await getActiveUsersForPatients(state.pendingBills.map((bill) => bill.patientId));
      const pendingByPatient = new Map();
      for (const bill of state.pendingBills) {
        const prev = pendingByPatient.get(bill.patientId) || 0;
        pendingByPatient.set(bill.patientId, prev + Number(bill.netAmount || 0));
      }

      for (const mapItem of mappings) {
        const dueAmount = Number((pendingByPatient.get(mapItem.patientId) || 0).toFixed(2));
        if (dueAmount <= 0) continue;
        await createNotificationsForUsers([mapItem.userId], {
          title: 'Pending Bill Reminder',
          message: `You have pending hospital payments totaling $${dueAmount.toFixed(2)}. Please contact billing for assistance.`,
          type: 'Bill',
        });
      }

      return { ...state, billingInsights: response.content };
    });

    workflow.setEntryPoint('fetch_pending');
    workflow.addEdge('fetch_pending', 'analyze_and_remind');
    workflow.addEdge('analyze_and_remind', END);

    const app = workflow.compile();
    const result = await app.invoke({});
    logger.info('Billing agent completed', { pendingBills: result.pendingBills?.length || 0, role: actor.role, userId: actor.id });
    return {
      ...result,
      appliedContext: String(operatorContext || '').trim() || null,
    };
  } catch (error) {
    logger.warn('Billing agent fallback used', { role: actor.role, userId: actor.id, message: error.message });
    const pendingBills = await db.Bill.findAll({
      where: { paymentStatus: 'Pending' },
      include: [{ model: db.Patient, as: 'patient' }],
      limit: 10,
    });
    const totalPending = pendingBills.reduce((sum, bill) => sum + parseFloat(bill.netAmount || 0), 0);
    return {
      pendingBills,
      billingInsights: pendingBills.length === 0
        ? 'No pending bills to review.'
        : `There are ${pendingBills.length} pending bills totaling $${totalPending.toFixed(2)}. Follow up with billing staff today.`,
      appliedContext: String(operatorContext || '').trim() || null,
    };
  }
};

module.exports = {
  runSchedulingAgent,
  runFollowUpAgent,
  runInventoryAgent,
  runBillingAgent,
};
