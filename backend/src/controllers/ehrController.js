const logger = require('../utils/logger');
const db = require('../models');
const { logAudit } = require('../services/auditService');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const createEHR = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      diagnosis,
      symptoms,
      treatmentPlan,
      notes,
      appointmentId,
    } = req.body;

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const doctor = await db.Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: 'error', message: 'Doctor not found' });
    }

    if (appointmentId) {
      const appointment = await db.Appointment.findByPk(appointmentId);
      if (!appointment) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }
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
  } catch (error) {
    logger.error('Create EHR error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getEHRs = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId, appointmentId } = req.query;
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
    if (appointmentId) whereClause.appointmentId = appointmentId;

    const { count, rows: ehrs } = await db.EHR.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
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
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get EHRs error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getEHRById = async (req, res) => {
  try {
    const { id } = req.params;

    const ehr = await db.EHR.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.Appointment, as: 'appointment' },
        { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
        { model: db.Prescription, as: 'prescriptions', include: [{ model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }] },
      ],
    });

    if (!ehr) {
      return res.status(404).json({ status: 'error', message: 'EHR record not found' });
    }

    res.status(200).json({
      status: 'success',
      data: ehr,
    });
  } catch (error) {
    logger.error('Get EHR by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateEHR = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, symptoms, treatmentPlan, notes } = req.body;

    const ehr = await db.EHR.findByPk(id);
    if (!ehr) {
      return res.status(404).json({ status: 'error', message: 'EHR record not found' });
    }

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
  } catch (error) {
    logger.error('Update EHR error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteEHR = async (req, res) => {
  try {
    const { id } = req.params;

    const ehr = await db.EHR.findByPk(id);
    if (!ehr) {
      return res.status(404).json({ status: 'error', message: 'EHR record not found' });
    }

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
  } catch (error) {
    logger.error('Delete EHR error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createEHR,
  getEHRs,
  getEHRById,
  updateEHR,
  deleteEHR,
};
