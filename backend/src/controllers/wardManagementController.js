const logger = require('../utils/logger');
const db = require('../models');
const { UniqueConstraintError } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

// WARD CONTROLLERS
const createWard = asyncHandler(async (req, res) => {
  await findByPkOr404(db.Department, req.body.departmentId, 'Department');

  const ward = await db.Ward.create(req.body);

  const populatedWard = await db.Ward.findByPk(ward.id, {
    include: [{ model: db.Department, as: 'department' }],
  });

  res.status(201).json({
    status: 'success',
    message: 'Ward created successfully',
    data: populatedWard,
  });
});

const getWards = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  const { count, rows: wards } = await db.Ward.findAndCountAll({
    include: [{ model: db.Department, as: 'department' }],
    limit,
    offset,
    order: [['name', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      wards,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getWardById = asyncHandler(async (req, res) => {
  const ward = await findByPkOr404(db.Ward, req.params.id, 'Ward', {
    include: [
      { model: db.Department, as: 'department' },
      { model: db.Bed, as: 'beds' },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: ward,
  });
});

const updateWard = asyncHandler(async (req, res) => {
  const ward = await findByPkOr404(db.Ward, req.params.id, 'Ward');
  await ward.update(req.body);

  const populatedWard = await db.Ward.findByPk(ward.id, {
    include: [{ model: db.Department, as: 'department' }],
  });

  res.status(200).json({
    status: 'success',
    message: 'Ward updated successfully',
    data: populatedWard,
  });
});

const deleteWard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ward = await findByPkOr404(db.Ward, id, 'Ward');

  const bedCount = await db.Bed.count({ where: { wardId: id } });
  if (bedCount > 0) {
    return res.status(400).json({ status: 'error', message: 'Cannot delete ward with existing beds' });
  }

  await ward.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Ward deleted successfully',
  });
});

// BED CONTROLLERS
const createBed = asyncHandler(async (req, res) => {
  await findByPkOr404(db.Ward, req.body.wardId, 'Ward');

  try {
    const bed = await db.Bed.create(req.body);

    const populatedBed = await db.Bed.findByPk(bed.id, {
      include: [{ model: db.Ward, as: 'ward' }],
    });

    res.status(201).json({
      status: 'success',
      message: 'Bed created successfully',
      data: populatedBed,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Bed number already exists in this ward' });
    }
    throw error;
  }
});

const getBeds = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { wardId, status } = req.query;

  let whereClause = {};
  if (wardId) whereClause.wardId = wardId;
  if (status) whereClause.status = status;

  const { count, rows: beds } = await db.Bed.findAndCountAll({
    where: whereClause,
    include: [{ model: db.Ward, as: 'ward' }],
    limit,
    offset,
    order: [['bedNumber', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      beds,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getBedById = asyncHandler(async (req, res) => {
  const bed = await findByPkOr404(db.Bed, req.params.id, 'Bed', {
    include: [{ model: db.Ward, as: 'ward' }],
  });

  res.status(200).json({
    status: 'success',
    data: bed,
  });
});

const updateBed = asyncHandler(async (req, res) => {
  const bed = await findByPkOr404(db.Bed, req.params.id, 'Bed');

  try {
    await bed.update(req.body);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Bed number already exists in this ward' });
    }
    throw error;
  }

  const populatedBed = await db.Bed.findByPk(bed.id, {
    include: [{ model: db.Ward, as: 'ward' }],
  });

  res.status(200).json({
    status: 'success',
    message: 'Bed updated successfully',
    data: populatedBed,
  });
});

const deleteBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bed = await findByPkOr404(db.Bed, id, 'Bed');

  const activeAdmission = await db.Admission.findOne({ where: { bedId: id, status: 'Admitted' } });
  if (activeAdmission) {
    return res.status(400).json({ status: 'error', message: 'Cannot delete bed with active admission' });
  }

  await bed.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Bed deleted successfully',
  });
});

// ADMISSION CONTROLLERS
const createAdmission = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { patientId, doctorId, bedId, reasonForAdmission, notes } = req.body;

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

    const bed = await db.Bed.findByPk(bedId);
    if (!bed) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Bed not found' });
    }

    if (bed.status !== 'Available') {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Bed is not available' });
    }

    const admission = await db.Admission.create({
      patientId,
      doctorId,
      bedId,
      reasonForAdmission,
      notes,
      admittedBy: req.user.id,
      status: 'Admitted',
    }, { transaction });

    await bed.update({ status: 'Occupied' }, { transaction });

    await transaction.commit();

    const populatedAdmission = await db.Admission.findByPk(admission.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] },
        { model: db.User, as: 'admittedByUser', attributes: { exclude: ['password'] } },
      ],
    });

    res.status(201).json({
      status: 'success',
      message: 'Patient admitted successfully',
      data: populatedAdmission,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

const getAdmissions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { patientId, doctorId, status } = req.query;

  let whereClause = {};
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) whereClause.doctorId = doctorId;
  if (status) whereClause.status = status;

  const { count, rows: admissions } = await db.Admission.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] },
    ],
    limit,
    offset,
    order: [['admissionDate', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      admissions,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getAdmissionById = asyncHandler(async (req, res) => {
  const admission = await findByPkOr404(db.Admission, req.params.id, 'Admission', {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] },
      { model: db.User, as: 'admittedByUser', attributes: { exclude: ['password'] } },
      { model: db.User, as: 'dischargedByUser', attributes: { exclude: ['password'] } },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: admission,
  });
});

const updateAdmission = asyncHandler(async (req, res) => {
  const admission = await findByPkOr404(db.Admission, req.params.id, 'Admission');
  const { bedId, ...updates } = req.body;

  if (bedId && bedId !== admission.bedId) {
    const newBed = await db.Bed.findByPk(bedId);
    if (!newBed) {
      return res.status(404).json({ status: 'error', message: 'New bed not found' });
    }
    if (newBed.status !== 'Available') {
      return res.status(400).json({ status: 'error', message: 'New bed is not available' });
    }
    const oldBed = await db.Bed.findByPk(admission.bedId);
    if (oldBed) {
      await oldBed.update({ status: 'Available' });
    }
    await newBed.update({ status: 'Occupied' });
  }

  await admission.update({ ...updates, bedId });

  const populatedAdmission = await db.Admission.findByPk(admission.id, {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] },
    ],
  });

  res.status(200).json({
    status: 'success',
    message: 'Admission updated successfully',
    data: populatedAdmission,
  });
});

const dischargePatient = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const admission = await db.Admission.findByPk(id);
    if (!admission) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Admission not found' });
    }

    if (admission.status !== 'Admitted') {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Patient is not currently admitted' });
    }

    await admission.update({
      status: 'Discharged',
      dischargeDate: new Date(),
      dischargedBy: req.user.id,
      notes,
    }, { transaction });

    const bed = await db.Bed.findByPk(admission.bedId);
    if (bed) {
      await bed.update({ status: 'Available' }, { transaction });
    }

    await transaction.commit();

    const populatedAdmission = await db.Admission.findByPk(admission.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] },
        { model: db.User, as: 'dischargedByUser', attributes: { exclude: ['password'] } },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Patient discharged successfully',
      data: populatedAdmission,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

const deleteAdmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const admission = await findByPkOr404(db.Admission, id, 'Admission');

  await admission.destroy();

  const bed = await db.Bed.findByPk(admission.bedId);
  if (bed && bed.status === 'Occupied') {
    await bed.update({ status: 'Available' });
  }

  res.status(200).json({
    status: 'success',
    message: 'Admission deleted successfully',
  });
});

module.exports = {
  createWard,
  getWards,
  getWardById,
  updateWard,
  deleteWard,
  createBed,
  getBeds,
  getBedById,
  updateBed,
  deleteBed,
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmission,
  dischargePatient,
  deleteAdmission,
};
