const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notificationService');

const createClaim = async (req, res) => {
  try {
    const claim = await db.Claim.create(req.body);
    return res.status(201).json({ status: 'success', data: claim });
  } catch (error) {
    logger.error('Create claim error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to create claim' });
  }
};

const listClaims = async (req, res) => {
  try {
    const claims = await db.Claim.findAll({
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Insurance, as: 'insurance' },
        { model: db.Bill, as: 'bill' },
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(req.query.limit || 100), 300),
    });

    return res.status(200).json({ status: 'success', data: { claims } });
  } catch (error) {
    logger.error('List claims error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to list claims' });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const claim = await db.Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ status: 'error', message: 'Claim not found' });

    await claim.update(req.body);
    return res.status(200).json({ status: 'success', data: claim });
  } catch (error) {
    logger.error('Update claim status error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update claim status' });
  }
};

const createOrUpdateDischargePathway = async (req, res) => {
  try {
    const { admissionId, checklist, status, expectedDischargeDate } = req.body;

    let pathway = await db.DischargePathway.findOne({ where: { admissionId } });
    if (!pathway) {
      pathway = await db.DischargePathway.create({
        admissionId,
        checklist: checklist || undefined,
        status: status || undefined,
        expectedDischargeDate: expectedDischargeDate || undefined,
        ownerUserId: req.user.id,
      });
    } else {
      await pathway.update({
        checklist: checklist || pathway.checklist,
        status: status || pathway.status,
        expectedDischargeDate: expectedDischargeDate || pathway.expectedDischargeDate,
      });
    }

    if (pathway.status === 'Discharged' && !pathway.completedAt) {
      await pathway.update({ completedAt: new Date() });
    }

    return res.status(200).json({ status: 'success', data: pathway });
  } catch (error) {
    logger.error('Create/update discharge pathway error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to save discharge pathway' });
  }
};

const listDischargePathways = async (req, res) => {
  try {
    const pathways = await db.DischargePathway.findAll({
      include: [
        {
          model: db.Admission,
          as: 'admission',
          include: [{ model: db.Patient, as: 'patient' }, { model: db.Doctor, as: 'doctor' }],
        },
        { model: db.User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['updatedAt', 'DESC']],
      limit: Math.min(Number(req.query.limit || 100), 300),
    });

    return res.status(200).json({ status: 'success', data: { pathways } });
  } catch (error) {
    logger.error('List discharge pathways error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to list discharge pathways' });
  }
};

const sendPatientCommunication = async (req, res) => {
  try {
    const { patientId, channel, category, subject, content, metadata } = req.body;

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const communication = await db.CommunicationLog.create({
      patientId,
      sentBy: req.user.id,
      channel,
      category,
      subject,
      content,
      status: 'Sent',
      metadata,
    });

    await createNotification({
      userId: req.user.id,
      title: `Communication Sent (${channel})`,
      message: `${category || 'General'} message sent to ${patient.firstName} ${patient.lastName}`,
      type: 'System',
      relatedId: communication.id,
    });

    return res.status(201).json({ status: 'success', data: communication });
  } catch (error) {
    logger.error('Send patient communication error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send communication' });
  }
};

const listCommunications = async (req, res) => {
  try {
    const where = {};
    if (req.query.patientId) where.patientId = req.query.patientId;
    if (req.query.channel) where.channel = req.query.channel;
    if (req.query.category) where.category = req.query.category;

    const communications = await db.CommunicationLog.findAll({
      where,
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(req.query.limit || 100), 300),
    });

    return res.status(200).json({ status: 'success', data: { communications } });
  } catch (error) {
    logger.error('List communications error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to list communications' });
  }
};

module.exports = {
  createClaim,
  listClaims,
  updateClaimStatus,
  createOrUpdateDischargePathway,
  listDischargePathways,
  sendPatientCommunication,
  listCommunications,
};
