const logger = require('../utils/logger');
const db = require('../models');
const { logAudit } = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const createEHR = asyncHandler(async (req, res) => {
  const {
    patientId,
    doctorId,
    diagnosis,
    symptoms,
    treatmentPlan,
    notes,
    appointmentId,
  } = req.body;

  await findByPkOr404(db.Patient, patientId, 'Patient');
  await findByPkOr404(db.Doctor, doctorId, 'Doctor');

  if (appointmentId) {
    await findByPkOr404(db.Appointment, appointmentId, 'Appointment');
  }

  const ehr = await db.EHR.create({
    patientId,
    doctorId,
    diagnosis,
    symptoms,
    treatmentPlan,
    notes,
    appointmentId,
    createdBy: req.user.id,
  });

  const populatedEHR = await db.EHR.findByPk(ehr.id, {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Appointment, as: 'appointment' },
      { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
    ],
  });

  try {
    await logAudit({
      req,
      action: 'CREATE',
      entityType: 'EHR',
      entityId: ehr.id,
      after: {
        patientId: ehr.patientId,
        doctorId: ehr.doctorId,
        diagnosis: ehr.diagnosis,
      },
    });
  } catch (auditError) {
    logger.warn('Post-create EHR audit log failed', { message: auditError.message });
  }

  res.status(201).json({
    status: 'success',
    message: 'EHR record created successfully',
    data: populatedEHR,
  });
});

const getEHRs = asyncHandler(async (req, res) => {
  const { patientId, doctorId, appointmentId } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let whereClause = {};
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) {
    if (isUuid(doctorId)) {
      whereClause.doctorId = doctorId;
    } else {
      const doctor = await db.Doctor.findOne({ where: { licenseNumber: doctorId } });
      if (!doctor) {
        return res.status(404).json({ status: 'error', message: 'Doctor not found for provided license number' });
      }
      whereClause.doctorId = doctor.id;
    }
  }
  if (appointmentId) whereClause.appointmentId = appointmentId;

  const { count, rows: ehrs } = await db.EHR.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Appointment, as: 'appointment' },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      ehrs,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getEHRById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ehr = await findByPkOr404(db.EHR, id, 'EHR record', {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Appointment, as: 'appointment' },
      { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
      { model: db.Prescription, as: 'prescriptions', include: [{ model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }] },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: ehr,
  });
});

const updateEHR = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { diagnosis, symptoms, treatmentPlan, notes } = req.body;

  const ehr = await findByPkOr404(db.EHR, id, 'EHR record');

  const beforeState = ehr.toJSON();

  await ehr.update({
    diagnosis,
    symptoms,
    treatmentPlan,
    notes,
  });

  const populatedEHR = await db.EHR.findByPk(ehr.id, {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Appointment, as: 'appointment' },
    ],
  });

  try {
    await logAudit({
      req,
      action: 'UPDATE',
      entityType: 'EHR',
      entityId: ehr.id,
      before: {
        diagnosis: beforeState.diagnosis,
        symptoms: beforeState.symptoms,
      },
      after: {
        diagnosis: ehr.diagnosis,
        symptoms: ehr.symptoms,
      },
    });
  } catch (auditError) {
    logger.warn('Post-update EHR audit log failed', { message: auditError.message });
  }

  res.status(200).json({
    status: 'success',
    message: 'EHR record updated successfully',
    data: populatedEHR,
  });
});

const deleteEHR = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ehr = await findByPkOr404(db.EHR, id, 'EHR record');

  const beforeState = ehr.toJSON();
  await ehr.destroy();

  try {
    await logAudit({
      req,
      action: 'DELETE',
      entityType: 'EHR',
      entityId: id,
      before: {
        patientId: beforeState.patientId,
        doctorId: beforeState.doctorId,
        diagnosis: beforeState.diagnosis,
      },
    });
  } catch (auditError) {
    logger.warn('Post-delete EHR audit log failed', { message: auditError.message });
  }

  res.status(200).json({
    status: 'success',
    message: 'EHR record deleted successfully',
  });
});

module.exports = {
  createEHR,
  getEHRs,
  getEHRById,
  updateEHR,
  deleteEHR,
};
