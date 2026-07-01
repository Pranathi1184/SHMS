const logger = require('../utils/logger');
const db = require('../models');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

const createBill = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      patientId,
      billNumber,
      totalAmount,
      discount = 0,
      taxAmount = 0,
      paymentMode,
      paymentStatus = 'Pending',
      insuranceId,
      notes,
      items,
    } = req.body;

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    if (insuranceId) {
      const insurance = await db.Insurance.findByPk(insuranceId);
      if (!insurance) {
        await transaction.rollback();
        return res.status(404).json({ status: 'error', message: 'Insurance not found' });
      }
    }

    const netAmount = totalAmount - discount + taxAmount;

    const bill = await db.Bill.create({
      patientId,
      billNumber,
      totalAmount,
      discount,
      taxAmount,
      netAmount,
      paymentMode,
      paymentStatus,
      insuranceId,
      notes,
      createdBy: req.user.id,
    }, { transaction });

    for (const item of items) {
      await db.BillItem.create({
        billId: bill.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
      }, { transaction });
    }

    await transaction.commit();

    const populatedBill = await db.Bill.findByPk(bill.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
        { model: db.BillItem, as: 'items' },
      ],
    });

    try {
      await createNotification({
        userId: req.user.id,
        title: 'Bill Created',
        message: `Bill ${billNumber} has been created successfully.`,
        type: 'Bill',
        relatedId: bill.id,
        actionUrl: '/billing',
        metadata: { billNumber },
      });

      await logAudit({
        req,
        action: 'CREATE',
        entityType: 'Bill',
        entityId: bill.id,
        after: {
          billNumber: bill.billNumber,
          patientId: bill.patientId,
          totalAmount: bill.totalAmount,
          paymentStatus: bill.paymentStatus,
        },
      });
    } catch (sideEffectError) {
      logger.warn('Post-create bill side effects skipped', { message: sideEffectError.message });
    }

    res.status(201).json({
      status: 'success',
      message: 'Bill created successfully',
      data: populatedBill,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    logger.error('Create bill error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, paymentStatus } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (patientId) whereClause.patientId = patientId;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus;

    const { count, rows: bills } = await db.Bill.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.BillItem, as: 'items' },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['billDate', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        bills,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get bills error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await db.Bill.findByPk(id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
        { model: db.BillItem, as: 'items' },
      ],
    });

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({
      status: 'success',
      data: bill,
    });
  } catch (error) {
    logger.error('Get bill by id error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, discount, taxAmount, ...updates } = req.body;

    const bill = await db.Bill.findByPk(id);
    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    let netAmount = bill.netAmount;
    if (totalAmount !== undefined || discount !== undefined || taxAmount !== undefined) {
      const newTotal = totalAmount !== undefined ? totalAmount : bill.totalAmount;
      const newDiscount = discount !== undefined ? discount : bill.discount;
      const newTax = taxAmount !== undefined ? taxAmount : bill.taxAmount;
      netAmount = newTotal - newDiscount + newTax;
    }

    const beforeState = bill.toJSON();

    await bill.update({
      ...updates,
      totalAmount,
      discount,
      taxAmount,
      netAmount,
    });

    const populatedBill = await db.Bill.findByPk(bill.id, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.BillItem, as: 'items' },
      ],
    });

    try {
      await createNotification({
        userId: req.user.id,
        title: 'Bill Updated',
        message: `Bill ${populatedBill.billNumber} has been updated.`,
        type: 'Bill',
        relatedId: bill.id,
        actionUrl: '/billing',
        metadata: { billNumber: populatedBill.billNumber },
      });

      await logAudit({
        req,
        action: 'UPDATE',
        entityType: 'Bill',
        entityId: bill.id,
        before: {
          totalAmount: beforeState.totalAmount,
          discount: beforeState.discount,
          taxAmount: beforeState.taxAmount,
          paymentStatus: beforeState.paymentStatus,
        },
        after: {
          totalAmount: bill.totalAmount,
          discount: bill.discount,
          taxAmount: bill.taxAmount,
          paymentStatus: bill.paymentStatus,
        },
      });
    } catch (sideEffectError) {
      logger.warn('Post-update bill side effects skipped', { message: sideEffectError.message });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bill updated successfully',
      data: populatedBill,
    });
  } catch (error) {
    logger.error('Update bill error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await db.Bill.findByPk(id);
    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    const beforeState = bill.toJSON();
    await bill.destroy();

    try {
      await logAudit({
        req,
        action: 'DELETE',
        entityType: 'Bill',
        entityId: id,
        before: {
          billNumber: beforeState.billNumber,
          patientId: beforeState.patientId,
          totalAmount: beforeState.totalAmount,
        },
      });
    } catch (auditError) {
      logger.warn('Post-delete bill audit log failed', { message: auditError.message });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bill deleted successfully',
    });
  } catch (error) {
    logger.error('Delete bill error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
};
