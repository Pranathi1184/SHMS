const logger = require('../utils/logger');
const db = require('../models');
const aiService = require('../services/aiService');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

const createLabTest = asyncHandler(async (req, res) => {
  const {
    patientId,
    doctorId,
    testName,
    testCode,
    notes,
  } = req.body;

  await findByPkOr404(db.Patient, patientId, 'Patient');
  await findByPkOr404(db.Doctor, doctorId, 'Doctor');

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
});

const getLabTests = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { patientId, doctorId, status } = req.query;

  let whereClause = {};
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) whereClause.doctorId = doctorId;
  if (status) whereClause.status = status;

  const { count, rows: labTests } = await db.LaboratoryTest.findAndCountAll({
    where: whereClause,
    limit,
    offset,
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
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getLabTestById = asyncHandler(async (req, res) => {
  const labTest = await findByPkOr404(db.LaboratoryTest, req.params.id, 'Lab test', {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.User, as: 'orderedByUser', attributes: { exclude: ['password'] } },
      { model: db.User, as: 'performedByUser', attributes: { exclude: ['password'] } },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: labTest,
  });
});

const updateLabTest = asyncHandler(async (req, res) => {
  const labTest = await findByPkOr404(db.LaboratoryTest, req.params.id, 'Lab test');
  const { status, results, notes } = req.body;

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
});

const deleteLabTest = asyncHandler(async (req, res) => {
  const labTest = await findByPkOr404(db.LaboratoryTest, req.params.id, 'Lab test');
  await labTest.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Lab test deleted successfully',
  });
});

const generateLabReport = asyncHandler(async (req, res) => {
  const labTest = await findByPkOr404(db.LaboratoryTest, req.params.id, 'Lab test', {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
    ],
  });

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
});

module.exports = {
  createLabTest,
  getLabTests,
  getLabTestById,
  updateLabTest,
  deleteLabTest,
  generateLabReport,
};
