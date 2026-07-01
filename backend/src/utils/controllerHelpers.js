const db = require('../models');

const findByPkOr404 = async (model, id, entityName, options = {}) => {
  const record = await model.findByPk(id, options);
  if (!record) {
    const error = new Error(`${entityName} not found`);
    error.statusCode = 404;
    throw error;
  }
  return record;
};

const getLinkedPatientForUser = async (user) => {
  if (user?.role !== 'Patient') {
    return null;
  }
  return db.Patient.findOne({ where: { email: user.email } });
};

const generateBillNumber = (prefix = 'AUTO') => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}${d}-${rand}`;
};

module.exports = { findByPkOr404, getLinkedPatientForUser, generateBillNumber };
