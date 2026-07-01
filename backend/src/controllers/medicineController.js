const { Op } = require('sequelize');
const logger = require('../utils/logger');
const db = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404, generateBillNumber } = require('../utils/controllerHelpers');

const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await db.Medicine.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Medicine created successfully',
    data: medicine,
  });
});

const getMedicines = asyncHandler(async (req, res) => {
  const { search = '', lowStock } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { genericName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (lowStock === 'true') {
    whereClause.quantity = { [Op.lte]: db.sequelize.col('reorderLevel') };
  }

  const { count, rows: medicines } = await db.Medicine.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['name', 'ASC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      medicines,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

const getMedicineById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await findByPkOr404(db.Medicine, id, 'Medicine');

  res.status(200).json({
    status: 'success',
    data: medicine,
  });
});

const updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await findByPkOr404(db.Medicine, id, 'Medicine');
  await medicine.update(req.body);

  res.status(200).json({
    status: 'success',
    message: 'Medicine updated successfully',
    data: medicine,
  });
});

const deleteMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await findByPkOr404(db.Medicine, id, 'Medicine');
  await medicine.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Medicine deleted successfully',
  });
});

const resolveFefoBatches = async (item, tx) => {
  if (item.medicineId) {
    const medicine = await db.Medicine.findByPk(item.medicineId, { transaction: tx });
    return medicine ? [medicine] : [];
  }

  const where = {
    quantity: { [Op.gt]: 0 },
  };

  if (item.name) {
    where[Op.or] = [
      { name: { [Op.iLike]: item.name } },
      { genericName: { [Op.iLike]: item.name } },
    ];
  }

  return db.Medicine.findAll({
    where,
    order: [['expiryDate', 'ASC'], ['createdAt', 'ASC']],
    transaction: tx,
  });
};

const createPharmacySale = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { patientId, items, notes } = req.body;

    const patient = await db.Patient.findByPk(patientId, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    const saleLines = [];
    let gross = 0;

    for (const item of items) {
      let remainingQty = Number(item.quantity);
      const batches = await resolveFefoBatches(item, transaction);

      if (!batches.length) {
        await transaction.rollback();
        return res.status(404).json({ status: 'error', message: `No stock batch found for ${item.name || item.medicineId}` });
      }

      for (const batch of batches) {
        if (remainingQty <= 0) break;
        const available = Number(batch.quantity || 0);
        if (available <= 0) continue;

        const consume = Math.min(remainingQty, available);
        const unitPrice = Number(batch.unitPrice || 0);
        const lineTotal = Number((consume * unitPrice).toFixed(2));

        saleLines.push({
          medicineId: batch.id,
          medicineName: batch.name,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: consume,
          unitPrice,
          totalPrice: lineTotal,
        });

        await batch.update({ quantity: available - consume }, { transaction });
        gross += lineTotal;
        remainingQty -= consume;
      }

      if (remainingQty > 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Insufficient FEFO stock for ${item.name || item.medicineId}`,
        });
      }
    }

    const bill = await db.Bill.create({
      patientId,
      billNumber: generateBillNumber('PHARM'),
      billDate: new Date(),
      totalAmount: gross,
      discount: 0,
      taxAmount: 0,
      netAmount: gross,
      paymentMode: 'Other',
      paymentStatus: 'Pending',
      notes: notes || 'Pharmacy sale generated via FEFO flow',
      createdBy: req.user.id,
    }, { transaction });

    await db.BillItem.bulkCreate(
      saleLines.map((line) => ({
        billId: bill.id,
        description: `${line.medicineName} | Batch: ${line.batchNumber || 'N/A'} | Exp: ${line.expiryDate || 'N/A'}`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
      })),
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Pharmacy sale created with FEFO allocation',
      data: {
        billId: bill.id,
        billNumber: bill.billNumber,
        totalAmount: gross,
        lines: saleLines,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
});

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  createPharmacySale,
};
