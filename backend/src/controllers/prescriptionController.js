const logger = require('../utils/logger');
const db = require('../models');
const { logAudit } = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404, getLinkedPatientForUser } = require('../utils/controllerHelpers');

const createPrescription = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      patientId,
      doctorId,
      ehrId,
      notes,
      items,
    } = req.body;

    await findByPkOr404(db.Patient, patientId, 'Patient');
    await findByPkOr404(db.Doctor, doctorId, 'Doctor');

    if (ehrId) {
      await findByPkOr404(db.EHR, ehrId, 'EHR');
    }

    const prescription = await db.Prescription.create({
      patientId,
      doctorId,
      ehrId,
      notes,
      createdBy: req.user.id,
    }, { transaction });

    for (const item of items) {
      await db.PrescriptionItem.create({
        prescriptionId: prescription.id,
        ...item,
      }, { transaction });
    }

    await transaction.commit();

    const populatedPrescription = await db.Prescription.findByPk(prescription.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
        { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] },
      ],
    });

    await logAudit({
      req,
      action: 'CREATE',
      entityType: 'Prescription',
      entityId: prescription.id,
      after: {
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        status: prescription.status,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Prescription created successfully',
      data: populatedPrescription,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

const getPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { patientId, doctorId, status } = req.query;

  let whereClause = {};
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) whereClause.doctorId = doctorId;
  if (status) whereClause.status = status;

  if (req.user.role === 'Patient') {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }
    whereClause.patientId = linkedPatient.id;
  }

  const { count, rows: prescriptions } = await db.Prescription.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }
    ],
    order: [['prescriptionDate', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      prescriptions,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await findByPkOr404(db.Prescription, req.params.id, 'Prescription', {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
      { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }
    ],
  });

  if (req.user.role === 'Patient') {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }

    if (prescription.patientId !== linkedPatient.id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
    }
  }

  res.status(200).json({
    status: 'success',
    data: prescription,
  });
});

const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await findByPkOr404(db.Prescription, req.params.id, 'Prescription');
  const { status, notes } = req.body;

  const beforeState = prescription.toJSON();
  await prescription.update({ status, notes });

  const populatedPrescription = await db.Prescription.findByPk(prescription.id, {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }
    ],
  });

  await logAudit({
    req,
    action: 'UPDATE',
    entityType: 'Prescription',
    entityId: prescription.id,
    before: {
      status: beforeState.status,
      notes: beforeState.notes,
    },
    after: {
      status: prescription.status,
      notes: prescription.notes,
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Prescription updated successfully',
    data: populatedPrescription,
  });
});

const dispensePrescription = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const prescription = await db.Prescription.findByPk(id, { include: [{ model: db.PrescriptionItem, as: 'items' }] });
    if (!prescription) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Prescription not found' });
    }

    if (prescription.status !== 'Pending') {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Prescription is not pending' });
    }

    for (const item of prescription.items) {
      const medicine = await db.Medicine.findByPk(item.medicineId);
      if (!medicine) {
        await transaction.rollback();
        return res.status(404).json({ status: 'error', message: `Medicine ${item.medicineId} not found` });
      }
      if (medicine.quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: `Insufficient stock for medicine ${medicine.name}` });
      }
    }

    for (const item of prescription.items) {
      const medicine = await db.Medicine.findByPk(item.medicineId);
      await medicine.update({ quantity: medicine.quantity - item.quantity }, { transaction });
    }

    const beforeState = prescription.toJSON();
    await prescription.update({ status: 'Dispensed' }, { transaction });

    await transaction.commit();

    const populatedPrescription = await db.Prescription.findByPk(prescription.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }
      ],
    });

    await logAudit({
      req,
      action: 'DISPENSE',
      entityType: 'Prescription',
      entityId: prescription.id,
      before: {
        status: beforeState.status,
      },
      after: {
        status: 'Dispensed',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Prescription dispensed successfully',
      data: populatedPrescription,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

const deletePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prescription = await findByPkOr404(db.Prescription, id, 'Prescription');

  const beforeState = prescription.toJSON();
  await prescription.destroy();

  await logAudit({
    req,
    action: 'DELETE',
    entityType: 'Prescription',
    entityId: id,
    before: {
      patientId: beforeState.patientId,
      doctorId: beforeState.doctorId,
      status: beforeState.status,
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Prescription deleted successfully',
  });
});

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  dispensePrescription,
  deletePrescription,
};
