const logger = require('../utils/logger');
const db = require('../models');
const aiService = require('../services/aiService');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const createLabTest = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      testName,
      testCode,
      notes,
    } = req.body;

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const doctor = await db.Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: 'error', message: 'Doctor not found' });
    }

    const labTest = await db.LaboratoryTest.create({
      patientId,
      doctorId,
      testName,
      testCode,
      notes,
      orderedBy: req.user.id,
    });

    const populatedLabTest = await db.LaboratoryTest.findByPk(labTest.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.User, as: 'orderedByUser', attributes: { exclude: ['password'] } },
      ],
    });

    res.status(201).json({
      status: 'success',
      message: 'Lab test ordered successfully',
      data: populatedLabTest,
    });
  } catch (error) {
    logger.error('Create lab test error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getLabTests = async (req, res) => {
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

    const { count, rows: labTests } = await db.LaboratoryTest.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.User, as: 'orderedByUser', attributes: { exclude: ['password'] } },
        { model: db.User, as: 'performedByUser', attributes: { exclude: ['password'] } },
      ],
      order: [['orderDate', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        labTests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get lab tests error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const labTest = await db.LaboratoryTest.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.User, as: 'orderedByUser', attributes: { exclude: ['password'] } },
        { model: db.User, as: 'performedByUser', attributes: { exclude: ['password'] } },
      ],
    });

    if (!labTest) {
      return res.status(404).json({ status: 'error', message: 'Lab test not found' });
    }

    res.status(200).json({
      status: 'success',
      data: labTest,
    });
  } catch (error) {
    logger.error('Get lab test by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, results, notes } = req.body;

    const labTest = await db.LaboratoryTest.findByPk(id);
    if (!labTest) {
      return res.status(404).json({ status: 'error', message: 'Lab test not found' });
    }

    const updateData = {
      status,
      results,
      notes,
    };

    if (status === 'Sample Collected' || status === 'In Progress' || status === 'Completed') {
      updateData.performedBy = req.user.id;
    }

    if (status === 'Completed') {
      updateData.resultDate = new Date();
    }

    await labTest.update(updateData);

    const populatedLabTest = await db.LaboratoryTest.findByPk(labTest.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.User, as: 'orderedByUser', attributes: { exclude: ['password'] } },
        { model: db.User, as: 'performedByUser', attributes: { exclude: ['password'] } },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Lab test updated successfully',
      data: populatedLabTest,
    });
  } catch (error) {
    logger.error('Update lab test error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    const labTest = await db.LaboratoryTest.findByPk(id);
    if (!labTest) {
      return res.status(404).json({ status: 'error', message: 'Lab test not found' });
    }

    await labTest.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Lab test deleted successfully',
    });
  } catch (error) {
    logger.error('Delete lab test error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const generateLabReport = async (req, res) => {
  try {
    const { id } = req.params;

    const labTest = await db.LaboratoryTest.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      ],
    });

    if (!labTest) {
      return res.status(404).json({ status: 'error', message: 'Lab test not found' });
    }

    const reportDraft = [
      `Patient: ${labTest.patient?.firstName || ''} ${labTest.patient?.lastName || ''}`.trim(),
      `Test: ${labTest.testName}`,
      `Status: ${labTest.status}`,
      `Ordered Date: ${labTest.orderDate}`,
      `Result Date: ${labTest.resultDate || 'N/A'}`,
      `Findings: ${JSON.stringify(labTest.results || {}, null, 2)}`,
      `Doctor: Dr. ${labTest.doctor?.user?.firstName || ''} ${labTest.doctor?.user?.lastName || ''}`.trim(),
      `Notes: ${labTest.notes || 'N/A'}`,
    ].join('\n');

    const professionalReport = await aiService.generateMedicalReport(reportDraft);

    return res.status(200).json({
      status: 'success',
      data: {
        testId: labTest.id,
        report: professionalReport,
      },
    });
  } catch (error) {
    logger.error('Generate lab report error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createLabTest,
  getLabTests,
  getLabTestById,
  updateLabTest,
  deleteLabTest,
  generateLabReport,
};
