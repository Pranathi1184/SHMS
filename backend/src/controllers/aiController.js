const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const db = require('../models');
const { Op } = require('sequelize');

const sendServerError = (res, operation, error) => {
  logger.error(`${operation} failed`, {
    message: error.message,
    stack: error.stack,
  });
  return res.status(500).json({
    status: 'error',
    message: `Failed to ${operation}`,
  });
};

const pickPatientSnapshot = (patientRecord) => {
  if (!patientRecord) return null;
  return {
    id: patientRecord.id,
    firstName: patientRecord.firstName,
    lastName: patientRecord.lastName,
    email: patientRecord.email,
    phone: patientRecord.phone,
    gender: patientRecord.gender,
    dateOfBirth: patientRecord.dateOfBirth,
  };
};

const resolveChatbotContext = async (viewer, patientId, query) => {
  const base = {
    query,
    viewer: {
      id: viewer.id,
      role: viewer.role,
      firstName: viewer.firstName,
      lastName: viewer.lastName,
      email: viewer.email,
    },
    scope: 'general',
  };

  if (viewer.role === 'Patient') {
    const patient = await db.Patient.findOne({
      where: { email: viewer.email },
      include: [
        { model: db.Prescription, as: 'prescriptions', limit: 10 },
        { model: db.Appointment, as: 'appointments', limit: 15 },
        { model: db.LaboratoryTest, as: 'laboratoryTests', limit: 10 },
      ],
    });

    return {
      ...base,
      scope: 'patient-self',
      patient: pickPatientSnapshot(patient),
      appointments: patient?.appointments || [],
      prescriptions: patient?.prescriptions || [],
      laboratoryTests: patient?.laboratoryTests || [],
      note: patient
        ? 'Context limited to current patient user.'
        : 'No linked patient profile found for this user email.',
    };
  }

  if (viewer.role === 'Doctor') {
    const doctor = await db.Doctor.findOne({
      where: { userId: viewer.id },
      include: [{ model: db.Department, as: 'department' }],
    });

    if (!doctor) {
      return {
        ...base,
        scope: 'doctor-limited',
        note: 'No doctor profile linked to this user account.',
      };
    }

    const where = { doctorId: doctor.id };
    if (patientId) {
      where.patientId = patientId;
    }

    const appointments = await db.Appointment.findAll({
      where,
      include: [{ model: db.Patient, as: 'patient' }],
      order: [['appointmentDate', 'DESC']],
      limit: 25,
    });

    const allowedPatientIds = new Set(appointments.map((item) => item.patientId));
    const scopedPatient = patientId && allowedPatientIds.has(patientId)
      ? await db.Patient.findByPk(patientId)
      : null;

    return {
      ...base,
      scope: 'doctor-own-patients',
      doctor: {
        id: doctor.id,
        department: doctor.department?.name || null,
        specialization: doctor.specialization,
      },
      appointments,
      patient: pickPatientSnapshot(scopedPatient),
      note: patientId && !scopedPatient
        ? 'Requested patient is outside this doctor scope.'
        : 'Context limited to this doctor and assigned patients.',
    };
  }

  if (viewer.role === 'Administrator') {
    const [patientsCount, doctorsCount, appointmentsCount, pendingBillsCount] = await Promise.all([
      db.Patient.count(),
      db.Doctor.count(),
      db.Appointment.count(),
      db.Bill.count({ where: { paymentStatus: 'Pending' } }),
    ]);

    const scopedPatient = patientId ? await db.Patient.findByPk(patientId) : null;

    return {
      ...base,
      scope: 'admin-operations',
      metrics: {
        patientsCount,
        doctorsCount,
        appointmentsCount,
        pendingBillsCount,
      },
      patient: pickPatientSnapshot(scopedPatient),
      note: 'Admin context includes operational metrics and optional selected patient.',
    };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [todaysAppointments, pendingBillsCount] = await Promise.all([
    db.Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay,
        },
      },
    }),
    db.Bill.count({ where: { paymentStatus: 'Pending' } }),
  ]);

  return {
    ...base,
    scope: 'staff-operational',
    metrics: {
      todaysAppointments,
      pendingBillsCount,
    },
    note: 'Staff context is limited to operational data.',
  };
};

const getPatientSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await db.Patient.findByPk(patientId, {
      include: [
        { model: db.EHR, as: 'ehrRecords' },
        { model: db.LaboratoryTest, as: 'laboratoryTests' },
        { model: db.Prescription, as: 'prescriptions' }
      ]
    });

    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const summary = await aiService.generatePatientSummary(patient);
    res.status(200).json({ status: 'success', data: { summary } });
  } catch (error) {
    return sendServerError(res, 'generate summary', error);
  }
};

const getMedicalReport = async (req, res) => {
  try {
    const { doctorNotes } = req.body;

    const report = await aiService.generateMedicalReport(doctorNotes);
    res.status(200).json({ status: 'success', data: { report } });
  } catch (error) {
    return sendServerError(res, 'generate report', error);
  }
};

const getReminderMessage = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await db.Appointment.findByPk(appointmentId, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    const message = await aiService.generateAppointmentReminder(appointment);
    res.status(200).json({ status: 'success', data: { message } });
  } catch (error) {
    return sendServerError(res, 'generate reminder', error);
  }
};

const handleChatbotQuery = async (req, res) => {
  try {
    const { query, patientId } = req.body;

    const context = await resolveChatbotContext(req.user, patientId, query);
    if (!context) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const response = await aiService.hospitalChatbot(query, context, req.user.role);
    res.status(200).json({ status: 'success', data: { response } });
  } catch (error) {
    return sendServerError(res, 'process query', error);
  }
};

const handleChatbotQueryGet = async (req, res) => {
  try {
    const { query, patientId } = req.query;

    const context = await resolveChatbotContext(req.user, patientId, query);
    if (!context) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const response = await aiService.hospitalChatbot(query, context, req.user.role);
    res.status(200).json({ status: 'success', data: { response } });
  } catch (error) {
    return sendServerError(res, 'process query', error);
  }
};

module.exports = {
  getPatientSummary,
  getMedicalReport,
  getReminderMessage,
  handleChatbotQuery,
  handleChatbotQueryGet,
};
