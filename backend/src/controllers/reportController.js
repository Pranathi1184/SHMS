const { Op, fn, col } = require('sequelize');
const { Parser } = require('json2csv');
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

/**
 * Export report data as CSV
 */
const exportReportCSV = async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let fields = [];

    switch (type) {
      case 'revenue': {
        const bills = await db.Bill.findAll({
          where: { paymentStatus: 'Paid' },
          attributes: ['billNumber', 'billDate', 'totalAmount', 'discount', 'taxAmount', 'netAmount', 'paymentMode'],
          order: [['billDate', 'DESC']],
          raw: true,
        });
        data = bills;
        fields = ['billNumber', 'billDate', 'totalAmount', 'discount', 'taxAmount', 'netAmount', 'paymentMode'];
        break;
      }
      case 'patients': {
        const patients = await db.Patient.findAll({
          attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'bloodType'],
          order: [['lastName', 'ASC']],
          raw: true,
        });
        data = patients;
        fields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'bloodType'];
        break;
      }
      case 'inventory': {
        const medicines = await db.Medicine.findAll({
          attributes: ['name', 'category', 'quantity', 'reorderLevel', 'unitPrice', 'expiryDate'],
          order: [['name', 'ASC']],
          raw: true,
        });
        data = medicines;
        fields = ['name', 'category', 'quantity', 'reorderLevel', 'unitPrice', 'expiryDate'];
        break;
      }
      case 'occupancy': {
        const admissions = await db.Admission.findAll({
          include: [
            { model: db.Patient, as: 'patient', attributes: ['firstName', 'lastName'] },
            { model: db.Bed, as: 'bed', attributes: ['bedNumber'], include: [{ model: db.Ward, as: 'ward', attributes: ['name'] }] },
          ],
          order: [['admissionDate', 'DESC']],
        });
        data = admissions.map(a => ({
          patientName: `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim(),
          ward: a.bed?.ward?.name || '',
          bed: a.bed?.bedNumber || '',
          admissionDate: a.admissionDate,
          dischargeDate: a.dischargeDate || '',
          status: a.status,
        }));
        fields = ['patientName', 'ward', 'bed', 'admissionDate', 'dischargeDate', 'status'];
        break;
      }
      default:
        return res.status(400).json({ status: 'error', message: 'Invalid report type. Use: revenue, patients, inventory, occupancy' });
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  } catch (error) {
    logger.error('Export CSV error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate CSV export' });
  }
};

/**
 * Data Reconciliation Job
 * Checks for data integrity issues across the system
 */
const runDataReconciliation = async (req, res) => {
  try {
    const issues = [];

    // 1. Orphan bills (bills without valid patient)
    const orphanBills = await db.sequelize.query(`
      SELECT b.id, b.bill_number FROM bills b
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE p.id IS NULL AND b.deleted_at IS NULL
    `, { type: db.sequelize.QueryTypes.SELECT }).catch(() => []);
    if (orphanBills.length > 0) {
      issues.push({ severity: 'HIGH', type: 'orphan_record', entity: 'bills', count: orphanBills.length, details: 'Bills referencing non-existent patients' });
    }

    // 2. Bill total vs items sum mismatch
    const billMismatches = await db.sequelize.query(`
      SELECT b.id, b.bill_number, b.total_amount,
        COALESCE(SUM(bi.total_price), 0) as items_sum
      FROM bills b
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      WHERE b.deleted_at IS NULL
      GROUP BY b.id, b.bill_number, b.total_amount
      HAVING ABS(b.total_amount - COALESCE(SUM(bi.total_price), 0)) > 0.01
    `, { type: db.sequelize.QueryTypes.SELECT }).catch(() => []);
    if (billMismatches.length > 0) {
      issues.push({ severity: 'HIGH', type: 'financial_mismatch', entity: 'bills', count: billMismatches.length, details: 'Bill totals do not match sum of line items' });
    }

    // 3. Orphan appointments (referencing non-existent doctor or patient)
    const orphanAppointments = await db.sequelize.query(`
      SELECT a.id FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE (p.id IS NULL OR d.id IS NULL) AND a.deleted_at IS NULL
    `, { type: db.sequelize.QueryTypes.SELECT }).catch(() => []);
    if (orphanAppointments.length > 0) {
      issues.push({ severity: 'MEDIUM', type: 'orphan_record', entity: 'appointments', count: orphanAppointments.length, details: 'Appointments referencing non-existent patient or doctor' });
    }

    // 4. Duplicate patients (same email)
    const duplicatePatients = await db.sequelize.query(`
      SELECT email, COUNT(*) as cnt FROM patients
      WHERE email IS NOT NULL AND deleted_at IS NULL
      GROUP BY email HAVING COUNT(*) > 1
    `, { type: db.sequelize.QueryTypes.SELECT }).catch(() => []);
    if (duplicatePatients.length > 0) {
      issues.push({ severity: 'MEDIUM', type: 'duplicate', entity: 'patients', count: duplicatePatients.length, details: 'Multiple patient records with the same email' });
    }

    // 5. Beds marked occupied without active admission
    const ghostOccupied = await db.sequelize.query(`
      SELECT b.id, b.bed_number FROM beds b
      LEFT JOIN admissions a ON b.id = a.bed_id AND a.status = 'Admitted'
      WHERE b.status = 'Occupied' AND a.id IS NULL
    `, { type: db.sequelize.QueryTypes.SELECT }).catch(() => []);
    if (ghostOccupied.length > 0) {
      issues.push({ severity: 'MEDIUM', type: 'status_inconsistency', entity: 'beds', count: ghostOccupied.length, details: 'Beds marked Occupied with no active admission' });
    }

    // 6. Prescriptions dispensed but no inventory deduction check
    const dispensedNoDeduc = await db.sequelize.query(`
      SELECT p.id FROM prescriptions p
      WHERE p.status = 'Dispensed' AND p.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM prescription_items pi WHERE pi.prescription_id = p.id
      )
    `, { type: db.sequelize.QueryTypes.SELECT }).catch(() => []);
    if (dispensedNoDeduc.length > 0) {
      issues.push({ severity: 'LOW', type: 'data_inconsistency', entity: 'prescriptions', count: dispensedNoDeduc.length, details: 'Dispensed prescriptions with no line items' });
    }

    const summary = {
      totalIssues: issues.reduce((sum, i) => sum + i.count, 0),
      highSeverity: issues.filter(i => i.severity === 'HIGH').length,
      mediumSeverity: issues.filter(i => i.severity === 'MEDIUM').length,
      lowSeverity: issues.filter(i => i.severity === 'LOW').length,
      checkedAt: new Date().toISOString(),
    };

    res.status(200).json({
      status: 'success',
      data: { summary, issues },
    });
  } catch (error) {
    logger.error('Data reconciliation error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to run data reconciliation' });
  }
};

module.exports = {
  getRevenueStats,
  getPatientStats,
  getDepartmentStats,
  getOccupancyStats,
  getInventoryAlerts,
  exportReportCSV,
  runDataReconciliation,
};
