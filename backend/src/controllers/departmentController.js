const logger = require('../utils/logger');
const db = require('../models');
const { UniqueConstraintError } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

const createDepartment = asyncHandler(async (req, res) => {
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
    throw error;
  }
});

const getDepartments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  const { count, rows: departments } = await db.Department.findAndCountAll({
    limit,
    offset,
    order: [['name', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      departments,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await findByPkOr404(db.Department, req.params.id, 'Department', {
    include: [
      { model: db.Doctor, as: 'doctors', include: [{ model: db.User, as: 'user' }] },
      { model: db.Ward, as: 'wards' },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: department,
  });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await findByPkOr404(db.Department, req.params.id, 'Department');

  try {
    await department.update(req.body);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Department name already exists' });
    }
    throw error;
  }

  res.status(200).json({
    status: 'success',
    message: 'Department updated successfully',
    data: department,
  });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const department = await findByPkOr404(db.Department, id, 'Department');

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
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
