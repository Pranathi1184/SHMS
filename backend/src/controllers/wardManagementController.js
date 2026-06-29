const logger = require('../utils/logger');
const db = require('../models');
const { UniqueConstraintError } = require('sequelize');

// WARD CONTROLLERS
const createWard = async (req, res) => {
  try {
    const { departmentId } = req.body;

    const department = await db.Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' });
    }

    const ward = await db.Ward.create(req.body);

    const populatedWard = await db.Ward.findByPk(ward.id, {
      include: [{ model: db.Department, as: 'department' }],
    });

    res.status(201).json({
      status: 'success',
      message: 'Ward created successfully',
      data: populatedWard,
    });
  } catch (error) {
    logger.error('Create ward error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getWards = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: wards } = await db.Ward.findAndCountAll({
      include: [{ model: db.Department, as: 'department' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        wards,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get wards error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getWardById = async (req, res) => {
  try {
    const { id } = req.params;

    const ward = await db.Ward.findByPk(id, {
      include: [
        { model: db.Department, as: 'department' },
        { model: db.Bed, as: 'beds' },
      ],
    });

    if (!ward) {
      return res.status(404).json({ status: 'error', message: 'Ward not found' });
    }

    res.status(200).json({
      status: 'success',
      data: ward,
    });
  } catch (error) {
    logger.error('Get ward by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateWard = async (req, res) => {
  try {
    const { id } = req.params;

    const ward = await db.Ward.findByPk(id);
    if (!ward) {
      return res.status(404).json({ status: 'error', message: 'Ward not found' });
    }

    await ward.update(req.body);

    const populatedWard = await db.Ward.findByPk(ward.id, {
      include: [{ model: db.Department, as: 'department' }],
    });

    res.status(200).json({
      status: 'success',
      message: 'Ward updated successfully',
      data: populatedWard,
    });
  } catch (error) {
    logger.error('Update ward error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteWard = async (req, res) => {
  try {
    const { id } = req.params;

    const ward = await db.Ward.findByPk(id);
    if (!ward) {
      return res.status(404).json({ status: 'error', message: 'Ward not found' });
    }

    const bedCount = await db.Bed.count({ where: { wardId: id } });
    if (bedCount > 0) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete ward with existing beds' });
    }

    await ward.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Ward deleted successfully',
    });
  } catch (error) {
    logger.error('Delete ward error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// BED CONTROLLERS
const createBed = async (req, res) => {
  try {
    const { wardId } = req.body;

    const ward = await db.Ward.findByPk(wardId);
    if (!ward) {
      return res.status(404).json({ status: 'error', message: 'Ward not found' });
    }

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
    logger.error('Create bed error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getBeds = async (req, res) => {
  try {
    const { page = 1, limit = 10, wardId, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (wardId) whereClause.wardId = wardId;
    if (status) whereClause.status = status;

    const { count, rows: beds } = await db.Bed.findAndCountAll({
      where: whereClause,
      include: [{ model: db.Ward, as: 'ward' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['bedNumber', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        beds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get beds error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getBedById = async (req, res) => {
  try {
    const { id } = req.params;

    const bed = await db.Bed.findByPk(id, {
      include: [{ model: db.Ward, as: 'ward' }],
    });

    if (!bed) {
      return res.status(404).json({ status: 'error', message: 'Bed not found' });
    }

    res.status(200).json({
      status: 'success',
      data: bed,
    });
  } catch (error) {
    logger.error('Get bed by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateBed = async (req, res) => {
  try {
    const { id } = req.params;

    const bed = await db.Bed.findByPk(id);
    if (!bed) {
      return res.status(404).json({ status: 'error', message: 'Bed not found' });
    }

    await bed.update(req.body);

    const populatedBed = await db.Bed.findByPk(bed.id, {
      include: [{ model: db.Ward, as: 'ward' }],
    });

    res.status(200).json({
      status: 'success',
      message: 'Bed updated successfully',
      data: populatedBed,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Bed number already exists in this ward' });
    }
    logger.error('Update bed error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteBed = async (req, res) => {
  try {
    const { id } = req.params;

    const bed = await db.Bed.findByPk(id);
    if (!bed) {
      return res.status(404).json({ status: 'error', message: 'Bed not found' });
    }

    const activeAdmission = await db.Admission.findOne({ where: { bedId: id, status: 'Admitted' } });
    if (activeAdmission) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete bed with active admission' });
    }

    await bed.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    logger.error('Delete bed error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ADMISSION CONTROLLERS
const createAdmission = async (req, res) => {
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
    logger.error('Create admission error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getAdmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId, status } = req.query;
    const offset = (page - 1) * limit;

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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['admissionDate', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        admissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get admissions error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await db.Admission.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
        { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] },
        { model: db.User, as: 'admittedByUser', attributes: { exclude: ['password'] } },
        { model: db.User, as: 'dischargedByUser', attributes: { exclude: ['password'] } },
      ],
    });

    if (!admission) {
      return res.status(404).json({ status: 'error', message: 'Admission not found' });
    }

    res.status(200).json({
      status: 'success',
      data: admission,
    });
  } catch (error) {
    logger.error('Get admission by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { bedId, ...updates } = req.body;

    const admission = await db.Admission.findByPk(id);
    if (!admission) {
      return res.status(404).json({ status: 'error', message: 'Admission not found' });
    }

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
  } catch (error) {
    logger.error('Update admission error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const dischargePatient = async (req, res) => {
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
    logger.error('Discharge patient error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await db.Admission.findByPk(id);
    if (!admission) {
      return res.status(404).json({ status: 'error', message: 'Admission not found' });
    }

    await admission.destroy();

    const bed = await db.Bed.findByPk(admission.bedId);
    if (bed && bed.status === 'Occupied') {
      await bed.update({ status: 'Available' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Admission deleted successfully',
    });
  } catch (error) {
    logger.error('Delete admission error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

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
