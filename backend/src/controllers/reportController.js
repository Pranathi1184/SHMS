const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');
const db = require('../models');

const parseDateRange = (query) => {
  const { fromDate, toDate } = query;
  const where = {};
  let hasRange = false;

  if (fromDate) {
    const parsed = new Date(fromDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid fromDate');
    }
    where[Op.gte] = parsed;
    hasRange = true;
  }

  if (toDate) {
    const parsed = new Date(toDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid toDate');
    }
    where[Op.lte] = parsed;
    hasRange = true;
  }

  return hasRange ? where : null;
};

const toNumber = (value) => Number(value || 0);

const toDateOnly = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

/**
 * Get Revenue Statistics
 * Returns daily revenue for the last 30 days and monthly revenue for the last year
 */
const getRevenueStats = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const where = {
      billDate: dateRange || { [Op.gte]: thirtyDaysAgo },
      paymentStatus: 'Paid',
    };

    const paidBills = await db.Bill.findAll({
      attributes: ['id', 'billDate', 'netAmount'],
      where,
      raw: true,
    });

    const dailyMap = new Map();
    const monthlyMap = new Map();

    paidBills.forEach((bill) => {
      const billDate = new Date(bill.billDate);
      if (Number.isNaN(billDate.getTime())) return;

      const dailyKey = toDateOnly(billDate);
      const monthlyKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}-01`;
      const amount = toNumber(bill.netAmount);

      const daily = dailyMap.get(dailyKey) || { date: dailyKey, totalRevenue: 0, totalBills: 0 };
      daily.totalRevenue += amount;
      daily.totalBills += 1;
      dailyMap.set(dailyKey, daily);

      if (billDate >= oneYearAgo || dateRange) {
        const monthly = monthlyMap.get(monthlyKey) || { month: monthlyKey, totalRevenue: 0 };
        monthly.totalRevenue += amount;
        monthlyMap.set(monthlyKey, monthly);
      }
    });

    const dailyRevenue = [...dailyMap.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
    const monthlyRevenue = [...monthlyMap.values()].sort((a, b) => new Date(a.month) - new Date(b.month));

    const totalRevenue = dailyRevenue.reduce((sum, row) => sum + toNumber(row.totalRevenue), 0);
    const totalTransactions = dailyRevenue.reduce((sum, row) => sum + toNumber(row.totalBills || 0), 0);

    res.status(200).json({
      status: 'success',
      data: {
        dailyRevenue,
        monthlyRevenue,
        summary: {
          totalRevenue,
          totalTransactions,
        },
      },
    });
  } catch (error) {
    logger.error('Get revenue stats error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * Get Patient Statistics
 * Returns total patients and count of new patients in the last 30 days
 */
const getPatientStats = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const createdAtWindow = dateRange || { [Op.gte]: thirtyDaysAgo };

    const totalPatients = await db.Patient.count();
    const newPatients = await db.Patient.count({
      where: {
        createdAt: createdAtWindow,
      },
    });

    // Patients by Gender
    const patientsByGender = await db.Patient.findAll({
      attributes: [
        'gender',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['gender'],
      raw: true,
    });

    const patientsCreatedByDate = await db.Patient.findAll({
      attributes: [[fn('DATE', col('created_at')), 'date'], [fn('COUNT', col('id')), 'count']],
      where: {
        createdAt: createdAtWindow,
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalPatients,
        newPatientsLast30Days: newPatients,
        patientsByGender,
        patientsCreatedByDate,
      },
    });
  } catch (error) {
    logger.error('Get patient stats error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getDepartmentStats = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query);
    const departments = await db.Department.findAll({
      include: [
        { model: db.Doctor, as: 'doctors', attributes: ['id'] },
      ],
      order: [['name', 'ASC']],
    });

    const appointmentWhere = {};
    if (dateRange) {
      appointmentWhere.appointmentDate = dateRange;
    }

    const appointments = await db.Appointment.findAll({
      attributes: ['doctorId'],
      where: appointmentWhere,
      raw: true,
    });

    const doctorDeptMap = new Map();
    departments.forEach((dept) => {
      (dept.doctors || []).forEach((doctor) => {
        doctorDeptMap.set(doctor.id, dept.id);
      });
    });

    const appointmentsByDepartment = {};
    appointments.forEach((appointment) => {
      const deptId = doctorDeptMap.get(appointment.doctorId);
      if (deptId) {
        appointmentsByDepartment[deptId] = (appointmentsByDepartment[deptId] || 0) + 1;
      }
    });

    const departmentStats = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      doctorCount: dept.doctors?.length || 0,
      appointmentCount: appointmentsByDepartment[dept.id] || 0,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        departments: departmentStats,
      },
    });
  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * Get Occupancy Statistics
 * Returns bed occupancy details
 */
const getOccupancyStats = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query);
    const bedStats = await db.Bed.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const totalBeds = await db.Bed.count();
    const occupiedBeds = await db.Bed.count({ where: { status: 'Occupied' } });
    const availableBeds = await db.Bed.count({ where: { status: 'Available' } });

    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Admissions by Ward Type
    const admissionWhere = { status: 'Admitted' };
    if (dateRange) {
      admissionWhere.admissionDate = dateRange;
    }

    const admissionsByWard = await db.Admission.findAll({
      where: admissionWhere,
      include: [
        {
          model: db.Bed,
          as: 'bed',
          include: [{ model: db.Ward, as: 'ward' }],
        },
      ],
    });

    const wardStats = {};
    admissionsByWard.forEach(adm => {
      const wardType = adm.bed.ward.type;
      wardStats[wardType] = (wardStats[wardType] || 0) + 1;
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        bedStatusBreakdown: bedStats,
        admissionsByWardType: wardStats,
      },
    });
  } catch (error) {
    logger.error('Get occupancy stats error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

/**
 * Get Inventory Alerts
 * Returns medicines that are low in stock
 */
const getInventoryAlerts = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query);
    const medicineWhere = dateRange ? { updatedAt: dateRange } : {};
    const medicines = await db.Medicine.findAll({
      where: medicineWhere,
      order: [['quantity', 'ASC']],
      raw: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ninetyDaysLater = new Date(today);
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

    const lowStockMedicines = medicines.filter((m) => toNumber(m.quantity) <= toNumber(m.reorderLevel));

    const expiringSoon = medicines
      .filter((m) => {
        const expiry = new Date(m.expiryDate);
        if (Number.isNaN(expiry.getTime())) return false;
        return expiry >= today && expiry <= ninetyDaysLater;
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    res.status(200).json({
      status: 'success',
      data: {
        lowStockCount: lowStockMedicines.length,
        lowStockMedicines,
        expiringSoonCount: expiringSoon.length,
        expiringSoon,
      },
    });
  } catch (error) {
    logger.error('Get inventory alerts error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  getRevenueStats,
  getPatientStats,
  getDepartmentStats,
  getOccupancyStats,
  getInventoryAlerts,
};
