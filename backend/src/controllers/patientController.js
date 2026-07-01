const { Op } = require('sequelize');
const logger = require('../utils/logger');
const db = require('../models');
const { uploadPatientDocumentBuffer } = require('../services/storageService');

const getLinkedPatientForUser = async (user) => {
  if (user?.role !== 'Patient') {
    return null;
  }

  return db.Patient.findOne({ where: { email: user.email } });
};

const createPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      bloodType,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    if (email) {
      const existingPatient = await db.Patient.findOne({ where: { email } });
      if (existingPatient) {
        return res.status(400).json({ status: 'error', message: 'Patient with this email already exists' });
      }
    }

    const patient = await db.Patient.create({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      bloodType,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
    });

    res.status(201).json({
      status: 'success',
      message: 'Patient created successfully',
      data: patient,
    });
  } catch (error) {
    logger.error('Create patient error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getPatients = async (req, res) => {
  try {
    if (req.user.role === 'Patient') {
      const linkedPatient = await getLinkedPatientForUser(req.user);
      if (!linkedPatient) {
        return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          patients: [linkedPatient],
          pagination: {
            page: 1,
            limit: 1,
            totalItems: 1,
            totalPages: 1,
          },
        },
      });
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      gender,
      bloodType,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    if (gender) {
      whereClause.gender = gender;
    }

    if (bloodType) {
      whereClause.bloodType = bloodType;
    }

    const allowedSortFields = new Set(['createdAt', 'firstName', 'lastName', 'dateOfBirth']);
    const effectiveSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
    const effectiveSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: patients } = await db.Patient.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[effectiveSortBy, effectiveSortOrder]],
    });

    res.status(200).json({
      status: 'success',
      data: {
        patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
        filters: {
          search,
          gender: gender || null,
          bloodType: bloodType || null,
          sortBy: effectiveSortBy,
          sortOrder: effectiveSortOrder,
        },
      },
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'Patient') {
      const linkedPatient = await getLinkedPatientForUser(req.user);
      if (!linkedPatient) {
        return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
      }

      if (linkedPatient.id !== id) {
        return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
      }
    }

    const patient = await db.Patient.findByPk(id, {
      include: [
        { model: db.Appointment, as: 'appointments', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }] },
        { model: db.EHR, as: 'ehrRecords', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }] },
        { model: db.Admission, as: 'admissions', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }, { model: db.Bed, as: 'bed', include: [{ model: db.Ward, as: 'ward' }] }] },
        { model: db.Prescription, as: 'prescriptions', include: [{ model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }] },
        { model: db.LaboratoryTest, as: 'laboratoryTests', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }] },
        { model: db.Bill, as: 'bills', include: [{ model: db.BillItem, as: 'items' }] },
        { model: db.Insurance, as: 'insuranceRecords' },
        { model: db.PatientDocument, as: 'documents', include: [{ model: db.User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] }] },
      ],
    });

    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    res.status(200).json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    logger.error('Get patient by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      bloodType,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    if (req.user.role === 'Patient') {
      const linkedPatient = await getLinkedPatientForUser(req.user);
      if (!linkedPatient) {
        return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
      }

      if (linkedPatient.id !== id) {
        return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
      }
    }

    const patient = await db.Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    if (email && email !== patient.email) {
      const existingPatient = await db.Patient.findOne({ where: { email } });
      if (existingPatient) {
        return res.status(400).json({ status: 'error', message: 'Patient with this email already exists' });
      }
    }

    await patient.update({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      bloodType,
      allergies,
      emergencyContactName,
      emergencyContactPhone,
    });

    res.status(200).json({
      status: 'success',
      message: 'Patient updated successfully',
      data: patient,
    });
  } catch (error) {
    logger.error('Update patient error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await db.Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    await patient.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    logger.error('Delete patient error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }

    const patient = await db.Patient.findByPk(linkedPatient.id, {
      include: [
        { model: db.Appointment, as: 'appointments', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }] },
        { model: db.EHR, as: 'ehrRecords', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }] },
        { model: db.LaboratoryTest, as: 'laboratoryTests', include: [{ model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] }] },
        { model: db.Prescription, as: 'prescriptions', include: [{ model: db.PrescriptionItem, as: 'items', include: [{ model: db.Medicine, as: 'medicine' }] }] },
        { model: db.Bill, as: 'bills', include: [{ model: db.BillItem, as: 'items' }] },
        { model: db.PatientDocument, as: 'documents', include: [{ model: db.User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] }] },
      ],
    });

    return res.status(200).json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    logger.error('Get my profile error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const canAccessPatient = async (viewer, patientId) => {
  if (viewer.role !== 'Patient') {
    return true;
  }

  const linkedPatient = await getLinkedPatientForUser(viewer);
  return Boolean(linkedPatient && linkedPatient.id === patientId);
};

const uploadPatientDocument = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const category = req.body.category || 'Other';
    const notes = req.body.notes;

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Document file is required' });
    }

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const accessAllowed = await canAccessPatient(req.user, patientId);
    if (!accessAllowed) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
    }

    const uploadMeta = await uploadPatientDocumentBuffer({
      patientId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });

    const document = await db.PatientDocument.create({
      patientId,
      uploadedBy: req.user.id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storageProvider: uploadMeta.storageProvider,
      storageKey: uploadMeta.storageKey,
      bucketName: uploadMeta.bucketName,
      fileUrl: uploadMeta.fileUrl,
      category,
      notes,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Patient document uploaded successfully',
      data: document,
    });
  } catch (error) {
    logger.error('Upload patient document error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getPatientDocuments = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const accessAllowed = await canAccessPatient(req.user, patientId);
    if (!accessAllowed) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
    }

    const documents = await db.PatientDocument.findAll({
      where: { patientId },
      include: [{ model: db.User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      data: { documents },
    });
  } catch (error) {
    logger.error('Get patient documents error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getMyProfile,
  getPatientById,
  updatePatient,
  deletePatient,
  uploadPatientDocument,
  getPatientDocuments,
};
