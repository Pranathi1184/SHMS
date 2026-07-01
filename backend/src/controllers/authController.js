const db = require('../models');
const logger = require('../utils/logger');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} = require('../utils/jwt');

const normalizeRole = (role) => {
  if (!role) return 'Patient';
  if (role === 'Admin') return 'Administrator';
  return role;
};

const resolveRequesterFromHeader = async (req) => {
  const authHeader = req.headers?.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return null;

  try {
    const decoded = verifyAccessToken(token);
    const requester = await db.User.findByPk(decoded.id);
    if (!requester || !requester.isActive) return null;
    return requester;
  } catch (error) {
    return null;
  }
};

const safeRollback = async (transaction) => {
  if (!transaction) return;
  if (transaction.finished) return;
  await transaction.rollback();
};

const register = async (req, res) => {
  let transaction = null;
  try {
    if (db?.sequelize?.transaction) {
      transaction = await db.sequelize.transaction();
    }

    const { firstName, lastName, email, password, role, phone, dateOfBirth, gender } = req.body;
    const requester = await resolveRequesterFromHeader(req);
    const normalizedRole = normalizeRole(role);

    if (normalizedRole !== 'Patient' && requester?.role !== 'Administrator') {
      await safeRollback(transaction);
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can create non-patient accounts',
      });
    }

    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      await safeRollback(transaction);
      return res
        .status(400)
        .json({ status: 'error', message: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: normalizedRole,
      phone,
    }, { transaction });

    if (normalizedRole === 'Patient') {
      const existingPatient = await db.Patient.findOne({ where: { email }, transaction });
      if (existingPatient) {
        await safeRollback(transaction);
        return res.status(400).json({ status: 'error', message: 'Patient with this email already exists' });
      }

      await db.Patient.create({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
      }, { transaction });
    }

    if (transaction) await transaction.commit();

    const userWithoutPassword = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: normalizedRole,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    await safeRollback(transaction);
    logger.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await db.User.findOne({ where: { email } });
    let skipPasswordCheck = false;

    if (!user) {
      const patientRecord = await db.Patient.findOne({ where: { email } });
      const autoProvisionEnabled = process.env.AUTO_PROVISION_PATIENT_LOGIN === 'true';
      const bootstrapPassword = process.env.SEED_PATIENT_PASSWORD || 'patient123';

      if (patientRecord && autoProvisionEnabled && password === bootstrapPassword) {
        const hashedPassword = await hashPassword(password);
        user = await db.User.create({
          firstName: patientRecord.firstName,
          lastName: patientRecord.lastName,
          email: patientRecord.email,
          password: hashedPassword,
          role: 'Patient',
          phone: patientRecord.phone,
          isActive: true,
        });
        skipPasswordCheck = true;
        logger.info('Auto-provisioned patient user during login', { email });
      }
    }

    if (!user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Invalid email or password' });
    }

    const isPasswordValid = skipPasswordCheck ? true : await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Account is deactivated' });
    }

    const userWithoutPassword = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete userWithoutPassword.password;

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyRefreshToken(refreshToken);

    const user = await db.User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
};
