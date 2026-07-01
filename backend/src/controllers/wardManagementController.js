const db = require('../models');
const { UniqueConstraintError } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

// WARD CONTROLLERS
const createWard = asyncHandler(async (req, res) => {
  const { departmentId } = req.body;

  await findByPkOr404(db.Department, departmentId, 'Department');

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
  const wards = await db.Ward.findAll({
    include: [
      { model: db.Department, as: 'department' },
      { model: db.Bed, as: 'beds' },
    ],
    order: [['name', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: { wards },
  });
});

const getWardById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ward = await findByPkOr404(db.Ward, id, 'Ward', {
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
  const { id } = req.params;

  const ward = await findByPkOr404(db.Ward, id, 'Ward');
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
  const { wardId } = req.body;

  await findByPkOr404(db.Ward, wardId, 'Ward');

  const bed = await db.Bed.create(req.body);

  const populatedBed = await db.Bed.findByPk(bed.id, {
    include: [{ model: db.Ward, as: 'ward' }],
  });

  res.status(201).json({
    status: 'success',
    message: 'Bed created successfully',
    data: populatedBed,
  });
});

const getBeds = asyncHandler(async (req, res) => {
  const { wardId, status } = req.query;

  let whereClause = {};
  if (wardId) whereClause.wardId = wardId;
  if (status) whereClause.status = status;

  const beds = await db.Bed.findAll({
    where: whereClause,
    include: [{ model: db.Ward, as: 'ward' }],
    order: [['bedNumber', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: { beds },
  });
});

const getBedById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bed = await findByPkOr404(db.Bed, id, 'Bed', {
    include: [{ model: db.Ward, as: 'ward' }],
  });

  res.status(200).json({
    status: 'success',
    data: bed,
  });
});

const updateBed = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bed = await findByPkOr404(db.Bed, id, 'Bed');

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
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
});

const getAdmissions = asyncHandler(async (req, res) => {
  const { patientId, doctorId, status } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

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
  const { id } = req.params;

  const admission = await findByPkOr404(db.Admission, id, 'Admission', {
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
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { bedId, ...updates } = req.body;

    const admission = await db.Admission.findByPk(id);
    if (!admission) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Admission not found' });
    }

    if (bedId && bedId !== admission.bedId) {
      const newBed = await db.Bed.findByPk(bedId);
      if (!newBed) {
        await transaction.rollback();
        return res.status(404).json({ status: 'error', message: 'New bed not found' });
      }
      if (newBed.status !== 'Available') {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: 'New bed is not available' });
      }
      const oldBed = await db.Bed.findByPk(admission.bedId);
      if (oldBed) {
        await oldBed.update({ status: 'Available' }, { transaction });
      }
      await newBed.update({ status: 'Occupied' }, { transaction });
    }

    await admission.update({ ...updates, bedId }, { transaction });

    await transaction.commit();

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
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
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
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
});

const deleteAdmission = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const admission = await db.Admission.findByPk(id);
    if (!admission) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Admission not found' });
    }

    const bedId = admission.bedId;
    await admission.destroy({ transaction });

    const bed = await db.Bed.findByPk(bedId);
    if (bed && bed.status === 'Occupied') {
      await bed.update({ status: 'Available' }, { transaction });
    }

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: 'Admission deleted successfully',
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
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
