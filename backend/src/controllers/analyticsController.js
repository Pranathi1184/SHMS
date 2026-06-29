const { QueryTypes, Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');

const safeQuery = async (sql, replacements = {}) => {
  return db.sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
  });
};

const getAnalyticsSummary = async (req, res) => {
  try {
    const [dailyRevenue, patientTrends, medicineDemand, occupancyForecast] = await Promise.all([
      safeQuery('SELECT date, total_revenue AS "totalRevenue", total_bills AS "totalBills" FROM daily_revenue ORDER BY date DESC LIMIT 60'),
      safeQuery('SELECT date, new_patients AS "newPatients", total_appointments AS "totalAppointments" FROM patient_trends ORDER BY date DESC LIMIT 60'),
      safeQuery('SELECT month, medicine_name AS "medicineName", predicted_quantity AS "predictedQuantity" FROM medicine_demand_forecast ORDER BY month DESC LIMIT 50'),
      safeQuery('SELECT date, predicted_occupancy_rate AS "predictedOccupancyRate", ward_type AS "wardType" FROM bed_occupancy_forecast ORDER BY date DESC LIMIT 40'),
    ]);

    const revenueSummary = dailyRevenue.reduce(
      (acc, row) => ({
        totalRevenue: acc.totalRevenue + Number(row.totalRevenue || 0),
        totalTransactions: acc.totalTransactions + Number(row.totalBills || 0),
      }),
      { totalRevenue: 0, totalTransactions: 0 }
    );

    res.status(200).json({
      status: 'success',
      data: {
        revenue: {
          dailyRevenue: [...dailyRevenue].reverse(),
          summary: revenueSummary,
        },
        patients: {
          patientsCreatedByDate: [...patientTrends].reverse(),
          totalPatients: patientTrends.reduce((acc, row) => acc + Number(row.newPatients || 0), 0),
        },
        ml: {
          medicineDemand,
          occupancyForecast,
        },
      },
    });
  } catch (error) {
    logger.error('Get analytics summary error:', error);
    if (error.parent?.code === '42P01') {
      return res.status(503).json({
        status: 'error',
        message: 'Analytics tables are not ready. Run ETL pipeline first.',
      });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to fetch analytics summary' });
  }
};

const getKpiDrilldown = async (req, res) => {
  try {
    const metric = (req.query.metric || 'revenue').toLowerCase();
    let rows = [];

    if (metric === 'revenue') {
      rows = await safeQuery(
        'SELECT date, total_revenue AS value, total_bills AS volume FROM daily_revenue ORDER BY date DESC LIMIT 90'
      );
    }

    if (metric === 'appointments') {
      rows = await safeQuery(
        'SELECT date, total_appointments AS value, new_patients AS volume FROM patient_trends ORDER BY date DESC LIMIT 90'
      );
    }

    if (metric === 'occupancy') {
      rows = await safeQuery(
        'SELECT date, ward_type AS category, predicted_occupancy_rate AS value FROM bed_occupancy_forecast ORDER BY date DESC LIMIT 90'
      );
    }

    if (['revenue', 'appointments', 'occupancy'].includes(metric)) {
      return res.status(200).json({ status: 'success', data: { metric, rows: rows.reverse() } });
    }

    return res.status(400).json({ status: 'error', message: 'Unsupported KPI metric' });
  } catch (error) {
    logger.error('Get KPI drilldown error:', error);
    if (['42P01', '42703'].includes(error.parent?.code)) {
      return res.status(200).json({
        status: 'success',
        data: {
          metric: (req.query.metric || 'revenue').toLowerCase(),
          rows: [],
          warning: 'KPI drilldown source is not ready yet. Run ETL pipeline first.',
        },
      });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to fetch KPI drilldown' });
  }
};

const getNoShowRisk = async (req, res) => {
  try {
    const idsRaw = (req.query.appointmentIds || '').split(',').map((id) => id.trim()).filter(Boolean);
    let rows = [];

    if (idsRaw.length > 0) {
      rows = await safeQuery(
        'SELECT appointment_id AS "appointmentId", risk_score AS "riskScore", risk_label AS "riskLabel", recommendation FROM no_show_predictions WHERE appointment_id = ANY(:ids)',
        { ids: idsRaw }
      );
    } else {
      rows = await safeQuery(
        'SELECT appointment_id AS "appointmentId", risk_score AS "riskScore", risk_label AS "riskLabel", recommendation FROM no_show_predictions ORDER BY score_date DESC LIMIT 200'
      );
    }

    const asMap = rows.reduce((acc, item) => {
      acc[item.appointmentId] = item;
      return acc;
    }, {});

    return res.status(200).json({ status: 'success', data: { items: rows, byAppointmentId: asMap } });
  } catch (error) {
    logger.error('Get no-show risk error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch no-show risk predictions' });
  }
};

const getDoctorLoadForecast = async (req, res) => {
  try {
    const rows = await safeQuery(
      'SELECT forecast_date AS "forecastDate", doctor_id AS "doctorId", predicted_appointments AS "predictedAppointments", recommendation FROM doctor_load_forecast ORDER BY forecast_date DESC LIMIT 300'
    );

    return res.status(200).json({ status: 'success', data: { forecasts: rows } });
  } catch (error) {
    logger.error('Get doctor load forecast error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch doctor load forecast' });
  }
};

const runDataQualityChecks = async (req, res) => {
  try {
    const duplicateEmails = await db.Patient.findAll({
      attributes: ['email', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['email'],
      having: db.sequelize.literal('COUNT(id) > 1'),
      raw: true,
    });

    const missingPhones = await db.Patient.count({ where: { phone: null } });
    const invalidDateAppointments = await db.Appointment.count({ where: { appointmentDate: null } });

    return res.status(200).json({
      status: 'success',
      data: {
        duplicatePatientEmails: duplicateEmails,
        missingPatientPhones: missingPhones,
        invalidAppointments: invalidDateAppointments,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Run data quality checks error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to run data quality checks' });
  }
};

const getCapacityHeatmap = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const doctors = await db.Doctor.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        { model: db.DoctorSchedule, as: 'doctorSchedule' },
      ],
      order: [[{ model: db.User, as: 'user' }, 'firstName', 'ASC']],
    });

    const appointments = await db.Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.gte]: dayStart,
          [Op.lt]: dayEnd,
        },
        status: {
          [Op.ne]: 'Cancelled',
        },
      },
      attributes: ['doctorId', 'startTime', 'endTime'],
    });

    const toMinutes = (timeValue) => {
      if (!timeValue) return NaN;
      const [h, m] = String(timeValue).slice(0, 5).split(':').map(Number);
      return (h * 60) + m;
    };
    const toTime = (value) => {
      const h = String(Math.floor(value / 60)).padStart(2, '0');
      const m = String(value % 60).padStart(2, '0');
      return `${h}:${m}`;
    };

    const doctorAppointmentMap = appointments.reduce((acc, apt) => {
      const key = apt.doctorId;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        start: toMinutes(apt.startTime),
        end: toMinutes(apt.endTime),
      });
      return acc;
    }, {});

    const heatmap = [];
    const recommendations = [];

    doctors.forEach((doctor) => {
      const schedule = doctor.doctorSchedule;
      const from = toMinutes(schedule?.availableFrom || '09:00');
      const to = toMinutes(schedule?.availableTo || '17:00');
      const step = Number(schedule?.slotDurationMinutes || 30);
      const slots = doctorAppointmentMap[doctor.id] || [];

      let blocks = 0;
      let bookedBlocks = 0;
      for (let pointer = from; pointer + step <= to; pointer += step) {
        blocks += 1;
        const blockStart = pointer;
        const blockEnd = pointer + step;
        const occupied = slots.some((slot) => blockStart < slot.end && slot.start < blockEnd);
        if (occupied) bookedBlocks += 1;

        heatmap.push({
          date,
          departmentId: doctor.department?.id || null,
          departmentName: doctor.department?.name || 'Unknown',
          doctorId: doctor.id,
          doctorName: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
          blockStart: toTime(blockStart),
          blockEnd: toTime(blockEnd),
          utilizationPercent: occupied ? 100 : 0,
        });
      }

      const utilization = blocks > 0 ? (bookedBlocks / blocks) * 100 : 0;
      if (utilization >= 85) {
        recommendations.push({
          doctorId: doctor.id,
          doctorName: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
          department: doctor.department?.name || 'Unknown',
          utilizationPercent: Number(utilization.toFixed(2)),
          recommendation: 'High load: rebalance by opening overflow slots or redirecting to adjacent doctors.',
        });
      } else if (utilization <= 30) {
        recommendations.push({
          doctorId: doctor.id,
          doctorName: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
          department: doctor.department?.name || 'Unknown',
          utilizationPercent: Number(utilization.toFixed(2)),
          recommendation: 'Low load: merge low-utilization blocks and prioritize this doctor in slot finder.',
        });
      }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        date,
        heatmap,
        recommendations,
      },
    });
  } catch (error) {
    logger.error('Get capacity heatmap error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch capacity heatmap' });
  }
};

module.exports = {
  getAnalyticsSummary,
  getKpiDrilldown,
  getNoShowRisk,
  getDoctorLoadForecast,
  runDataQualityChecks,
  getCapacityHeatmap,
};
