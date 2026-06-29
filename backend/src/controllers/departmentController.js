const logger = require('../utils/logger');
const db = require('../models');
const { UniqueConstraintError } = require('sequelize');

const createDepartment = async (req, res) => {
  try {
    const department = await db.Department.create(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Department name already exists' });
    }
    logger.error('Create department error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: departments } = await db.Department.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        departments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.Department.findByPk(id, {
      include: [
        { model: db.Doctor, as: 'doctors', include: [{ model: db.User, as: 'user' }] },
        { model: db.Ward, as: 'wards' },
      ],
    });

    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' });
    }

    res.status(200).json({
      status: 'success',
      data: department,
    });
  } catch (error) {
    logger.error('Get department by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' });
    }

    await department.update(req.body);

    res.status(200).json({
      status: 'success',
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Department name already exists' });
    }
    logger.error('Update department error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' });
    }

    const [doctorCount, wardCount] = await Promise.all([
      db.Doctor.count({ where: { departmentId: id } }),
      db.Ward.count({ where: { departmentId: id } }),
    ]);

    if (doctorCount > 0 || wardCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Department cannot be deleted while doctors or wards are assigned',
      });
    }

    await department.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Department deleted successfully',
    });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
