const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./models');
const logger = require('./utils/logger');
const { AppError } = require('./utils/errors');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const ehrRoutes = require('./routes/ehrRoutes');
const laboratoryTestRoutes = require('./routes/laboratoryTestRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const billRoutes = require('./routes/billRoutes');
const wardManagementRoutes = require('./routes/wardManagementRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const agentRoutes = require('./routes/agentRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const { featureFlags } = require('./middlewares/featureFlags');
const { requestObservability } = require('./middlewares/requestObservability');

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:80,http://localhost')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
    next();
  },
  express.static(path.join(process.cwd(), 'uploads'))
);
app.use(featureFlags);
app.use(requestObservability);

// Rate Limiting
const isProduction = process.env.NODE_ENV === 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 400 : 5000,
  message: { status: 'fail', message: 'Too many requests. Please retry shortly.' },
  skip: (req) => req.path.startsWith('/auth'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 120 : 1200,
  message: { status: 'fail', message: 'Too many authentication attempts. Please retry shortly.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/laboratory-tests', laboratoryTestRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/ward-management', wardManagementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/enterprise', enterpriseRoutes);

// Basic Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'SHMS API is running' });
});

// Test Database Connection
const testDbConnection = async () => {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully.');
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync();
      logger.info('Database synchronized.');
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
};

testDbConnection();

// Handle 404
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(err.message, { stack: err.stack });

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Production: Don't leak error details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
});

module.exports = app;
