const logger = require('../utils/logger');
const db = require('../models');
const { logAudit } = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

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

  res.status(201).json({
    status: 'success',
    message: 'EHR record created successfully',
    data: populatedEHR,
  });
});

const getEHRs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { patientId, doctorId, appointmentId } = req.query;

  let whereClause = {};
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) whereClause.doctorId = doctorId;
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
  const ehr = await findByPkOr404(db.EHR, req.params.id, 'EHR record', {
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
  const ehr = await findByPkOr404(db.EHR, req.params.id, 'EHR record');
  const { diagnosis, symptoms, treatmentPlan, notes } = req.body;

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
