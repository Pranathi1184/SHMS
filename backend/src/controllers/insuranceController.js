const db = require('../models');
const { UniqueConstraintError } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

const createInsurance = asyncHandler(async (req, res) => {
  const { patientId } = req.body;

  await findByPkOr404(db.Patient, patientId, 'Patient');

  try {
    const insurance = await db.Insurance.create(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Insurance created successfully',
      data: insurance,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Policy number already exists' });
    }
    throw error;
  }
});

const getInsurance = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { patientId } = req.query;

  let whereClause = {};
  if (patientId) whereClause.patientId = patientId;

  const { count, rows: insuranceRecords } = await db.Insurance.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.Patient, as: 'patient' },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      insuranceRecords,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getInsuranceById = asyncHandler(async (req, res) => {
  const insurance = await findByPkOr404(db.Insurance, req.params.id, 'Insurance', {
    include: [
      { model: db.Patient, as: 'patient' },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: insurance,
  });
});

const updateInsurance = asyncHandler(async (req, res) => {
  const insurance = await findByPkOr404(db.Insurance, req.params.id, 'Insurance');

  try {
    await insurance.update(req.body);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Policy number already exists' });
    }
    throw error;
  }

  res.status(200).json({
    status: 'success',
    message: 'Insurance updated successfully',
    data: insurance,
  });
});

const deleteInsurance = asyncHandler(async (req, res) => {
  const insurance = await findByPkOr404(db.Insurance, req.params.id, 'Insurance');
  await insurance.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Insurance deleted successfully',
  });
});

module.exports = {
  createInsurance,
  getInsurance,
  getInsuranceById,
  updateInsurance,
  deleteInsurance,
};
