const logger = require('../utils/logger');
const db = require('../models');
const { logAudit } = require('../services/auditService');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const getLinkedPatientForUser = async (user) => {
  if (user?.role !== 'Patient') {
    return null;
  }

  return db.Patient.findOne({ where: { email: user.email } });
};

const createPrescription = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      patientId,
      doctorId,
      ehrId,
      notes,
      items,
    } = req.body;

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const doctor = await db.Doctor.findByPk(doctorId);
    if (!doctor) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Doctor not found' });
    }

    if (ehrId) {
      const ehr = await db.EHR.findByPk(ehrId);
      if (!ehr) {
        await transaction.rollback();
        return res.status(404).json({ status: 'error', message: 'EHR not found' });
      }
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

    try {
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
    } catch (auditError) {
      logger.warn('Post-create prescription audit log failed', { message: auditError.message });
    }

    res.status(201).json({
      status: 'success',
      message: 'Prescription created successfully',
      data: populatedPrescription,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    logger.error('Create prescription error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId, status } = req.query;
    const offset = (page - 1) * limit;

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
      limit: parseInt(limit),
      offset: parseInt(offset),
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
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get prescriptions error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await db.Prescription.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
        { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }
      ],
    });

    if (!prescription) {
      return res.status(404).json({ status: 'error', message: 'Prescription not found' });
    }

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
  } catch (error) {
    logger.error('Get prescription by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const prescription = await db.Prescription.findByPk(id);
    if (!prescription) {
      return res.status(404).json({ status: 'error', message: 'Prescription not found' });
    }

    const beforeState = prescription.toJSON();
    await prescription.update({ status, notes });

    const populatedPrescription = await db.Prescription.findByPk(prescription.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }
      ],
    });

    try {
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
    } catch (auditError) {
      logger.warn('Post-update prescription audit log failed', { message: auditError.message });
    }

    res.status(200).json({
      status: 'success',
      message: 'Prescription updated successfully',
      data: populatedPrescription,
    });
  } catch (error) {
    logger.error('Update prescription error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const dispensePrescription = async (req, res) => {
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

    try {
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
    } catch (auditError) {
      logger.warn('Post-dispense prescription audit log failed', { message: auditError.message });
    }

    res.status(200).json({
      status: 'success',
      message: 'Prescription dispensed successfully',
      data: populatedPrescription,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    logger.error('Dispense prescription error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await db.Prescription.findByPk(id);
    if (!prescription) {
      return res.status(404).json({ status: 'error', message: 'Prescription not found' });
    }

    const beforeState = prescription.toJSON();
    await prescription.destroy();

    try {
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
    } catch (auditError) {
      logger.warn('Post-delete prescription audit log failed', { message: auditError.message });
    }

    res.status(200).json({
      status: 'success',
      message: 'Prescription deleted successfully',
    });
  } catch (error) {
    logger.error('Delete prescription error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  dispensePrescription,
  deletePrescription,
};
