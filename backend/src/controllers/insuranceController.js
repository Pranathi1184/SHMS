const logger = require('../utils/logger');
const db = require('../models');
const { UniqueConstraintError } = require('sequelize');

const createInsurance = async (req, res) => {
  try {
    const { patientId } = req.body;

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

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
    logger.error('Create insurance error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getInsurance = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (patientId) whereClause.patientId = patientId;

    const { count, rows: insuranceRecords } = await db.Insurance.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.Patient, as: 'patient' },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        insuranceRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get insurance error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getInsuranceById = async (req, res) => {
  try {
    const { id } = req.params;

    const insurance = await db.Insurance.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
      ],
    });

    if (!insurance) {
      return res.status(404).json({ status: 'error', message: 'Insurance not found' });
    }

    res.status(200).json({
      status: 'success',
      data: insurance,
    });
  } catch (error) {
    logger.error('Get insurance by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    const insurance = await db.Insurance.findByPk(id);
    if (!insurance) {
      return res.status(404).json({ status: 'error', message: 'Insurance not found' });
    }

    await insurance.update(req.body);

    res.status(200).json({
      status: 'success',
      message: 'Insurance updated successfully',
      data: insurance,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Policy number already exists' });
    }
    logger.error('Update insurance error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    const insurance = await db.Insurance.findByPk(id);
    if (!insurance) {
      return res.status(404).json({ status: 'error', message: 'Insurance not found' });
    }

    await insurance.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Insurance deleted successfully',
    });
  } catch (error) {
    logger.error('Delete insurance error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createInsurance,
  getInsurance,
  getInsuranceById,
  updateInsurance,
  deleteInsurance,
};
