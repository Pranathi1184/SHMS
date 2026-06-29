const { 
  NoShowPrediction, 
  DoctorLoadForecast, 
  MedicineDemandForecast, 
  BedOccupancyForecast, 
  BillingRiskScore,
  Appointment,
  Doctor,
  Medicine,
  Bill,
} = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Get no-show predictions for upcoming appointments
exports.getNoShowPredictions = async (req, res) => {
  try {
    const { limit = 20, riskLabel } = req.query;

    let where = {};
    if (riskLabel) {
      where.risk_label = riskLabel; // 'Low', 'Medium', 'High'
    }

    const predictions = await NoShowPrediction.findAll({
      where,
      include: [
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'appointmentDate', 'startTime', 'status'],
        },
      ],
      order: [['risk_score', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    logger.error(`Error fetching no-show predictions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch no-show predictions',
      error: error.message,
    });
  }
};

// Get doctor workload forecasts
exports.getDoctorLoadForecasts = async (req, res) => {
  try {
    const { limit = 20, doctorId } = req.query;

    let where = {};
    if (doctorId) {
      where.doctor_id = parseInt(doctorId);
    }

    const forecasts = await DoctorLoadForecast.findAll({
      where,
      include: [
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'userId', 'specialization', 'licenseNumber'],
        },
      ],
      order: [['forecast_date', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: forecasts.length,
      data: forecasts,
    });
  } catch (error) {
    logger.error(`Error fetching doctor load forecasts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor load forecasts',
      error: error.message,
    });
  }
};

// Get medicine demand forecasts
exports.getMedicineDemandForecasts = async (req, res) => {
  try {
    const { limit = 50, month, minConfidence = 0.6 } = req.query;

    let where = {};
    if (month) {
      where.month = month; // Format: YYYY-MM
    }
    if (minConfidence) {
      const { Op } = require('sequelize');
      where.confidence = { [Op.gte]: parseFloat(minConfidence) };
    }

    const forecasts = await MedicineDemandForecast.findAll({
      where,
      order: [['predicted_quantity', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: forecasts.length,
      data: forecasts,
    });
  } catch (error) {
    logger.error(`Error fetching medicine demand forecasts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine demand forecasts',
      error: error.message,
    });
  }
};

// Get bed occupancy forecasts
exports.getBedOccupancyForecasts = async (req, res) => {
  try {
    const { limit = 20, wardType } = req.query;

    let where = {};
    if (wardType) {
      where.ward_type = wardType;
    }

    const forecasts = await BedOccupancyForecast.findAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: forecasts.length,
      data: forecasts,
    });
  } catch (error) {
    logger.error(`Error fetching bed occupancy forecasts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed occupancy forecasts',
      error: error.message,
    });
  }
};

// Get billing risk scores
exports.getBillingRiskScores = async (req, res) => {
  try {
    const { limit = 30, riskLabel } = req.query;

    let where = {};
    if (riskLabel) {
      where.risk_label = riskLabel; // 'Low', 'Medium', 'High'
    }

    const scores = await BillingRiskScore.findAll({
      where,
      include: [
        {
          model: Bill,
          as: 'bill',
          attributes: ['id', 'patientId', 'totalAmount', 'paymentStatus'],
        },
      ],
      order: [['risk_score', 'DESC']],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: scores.length,
      data: scores,
    });
  } catch (error) {
    logger.error(`Error fetching billing risk scores: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing risk scores',
      error: error.message,
    });
  }
};

// Get comprehensive prediction dashboard summary
exports.getPredictionSummary = async (req, res) => {
  try {
    const [noShowHigh, doctorLoadHigh, medicineUrgent, occupancyHigh, billingHigh] = await Promise.all([
      NoShowPrediction.count({ where: { risk_label: 'High' } }),
      DoctorLoadForecast.count({ where: { predicted_appointments: { [require('sequelize').Op.gte]: 16 } } }),
      MedicineDemandForecast.count({ where: { confidence: { [require('sequelize').Op.gte]: 0.75 } } }),
      BedOccupancyForecast.count({ where: { predicted_occupancy_rate: { [require('sequelize').Op.gte]: 85 } } }),
      BillingRiskScore.count({ where: { risk_label: 'High' } }),
    ]);

    res.status(200).json({
      success: true,
      summary: {
        no_show_high_risk: noShowHigh,
        doctor_high_load: doctorLoadHigh,
        medicine_urgent: medicineUrgent,
        occupancy_high: occupancyHigh,
        billing_high_risk: billingHigh,
      },
    });
  } catch (error) {
    logger.error(`Error fetching prediction summary: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction summary',
      error: error.message,
    });
  }
};
