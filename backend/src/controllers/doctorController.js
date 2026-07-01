const { Op, UniqueConstraintError } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { hashPassword } = require('../utils/password');
const { createNotificationsForUsers } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404 } = require('../utils/controllerHelpers');
const { normalizeTime, toMinutes, formatMinutes, shiftTime } = require('../utils/timeUtils');

const normalizeAvailabilityPayload = (payload = {}) => {
  const availableDaysRaw = Array.isArray(payload.availableDays) && payload.availableDays.length
    ? payload.availableDays
    : [1, 2, 3, 4, 5];

  const availableDays = [...new Set(availableDaysRaw.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];

  return {
    availableFrom: payload.availableFrom || '09:00',
    availableTo: payload.availableTo || '17:00',
    slotDurationMinutes: Number(payload.slotDurationMinutes) > 0 ? Number(payload.slotDurationMinutes) : 30,
    availableDays: availableDays.length ? availableDays : [1, 2, 3, 4, 5],
  };
};

const getDoctors = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 25 });
  const { search = '', departmentId = '' } = req.query;
  const normalizedSearch = String(search || '').trim();

  const whereClause = {};
  const andConditions = [];

  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  if (normalizedSearch) {
    const like = `%${normalizedSearch}%`;
    andConditions.push({
      [Op.or]: [
        { '$user.firstName$': { [Op.iLike]: like } },
        { '$user.lastName$': { [Op.iLike]: like } },
        { '$user.email$': { [Op.iLike]: like } },
        { specialization: { [Op.iLike]: like } },
        { licenseNumber: { [Op.iLike]: like } },
      ],
    });
  }

  if (andConditions.length) {
    whereClause[Op.and] = [
      ...(whereClause[Op.and] || []),
      ...andConditions,
    ];
  }

  const { count, rows: doctors } = await db.Doctor.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    distinct: true,
    subQuery: false,
    include: [
      { model: db.User, as: 'user', attributes: { exclude: ['password'] } },
      { model: db.Department, as: 'department' },
      { model: db.DoctorSchedule, as: 'doctorSchedule' },
    ],
    order: [
      [{ model: db.User, as: 'user' }, 'firstName', 'ASC'],
      [{ model: db.User, as: 'user' }, 'lastName', 'ASC'],
    ],
  });

  return res.status(200).json({
    status: 'success',
    data: {
      doctors,
      pagination: buildPaginationResponse(count, page, limit),
      filters: {
        search: normalizedSearch || null,
        departmentId: departmentId || null,
      },
    },
  });
});

const createDoctor = asyncHandler(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      specialization,
      licenseNumber,
      consultationFee,
      password,
      availableFrom,
      availableTo,
      slotDurationMinutes,
      availableDays,
    } = req.body;

    const existingUser = await db.User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }

    const existingDoctor = await db.Doctor.findOne({ where: { licenseNumber }, transaction });
    if (existingDoctor) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'License number already exists' });
    }

    const department = await db.Department.findByPk(departmentId, { transaction });
    if (!department) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Department not found' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: 'Doctor',
      isActive: true,
    }, { transaction });

    const availability = normalizeAvailabilityPayload({
      availableFrom,
      availableTo,
      slotDurationMinutes,
      availableDays,
    });

    const doctor = await db.Doctor.create({
      userId: user.id,
      departmentId,
      specialization,
      licenseNumber,
      consultationFee,
    }, { transaction });

    await db.DoctorSchedule.create({
      doctorId: doctor.id,
      ...availability,
    }, { transaction });

    await transaction.commit();

    const createdDoctor = await db.Doctor.findByPk(doctor.id, {
      include: [
        { model: db.User, as: 'user', attributes: { exclude: ['password'] } },
        { model: db.Department, as: 'department' },
        { model: db.DoctorSchedule, as: 'doctorSchedule' },
      ],
    });

    return res.status(201).json({
      status: 'success',
      message: 'Doctor created successfully',
      data: createdDoctor,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ status: 'error', message: 'Doctor with this email or license number already exists' });
    }
    throw error;
  }
});

const updateDoctorAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await findByPkOr404(db.Doctor, id, 'Doctor', {
    include: [
      { model: db.User, as: 'user', attributes: { exclude: ['password'] } },
      { model: db.DoctorSchedule, as: 'doctorSchedule' },
    ],
  });

  if (req.user.role === 'Doctor' && doctor.userId !== req.user.id) {
    return res.status(403).json({ status: 'error', message: 'Forbidden - You can only update your own timings' });
  }

  const updates = normalizeAvailabilityPayload(req.body);
  if (doctor.doctorSchedule) {
    await doctor.doctorSchedule.update(updates);
  } else {
    await db.DoctorSchedule.create({
      doctorId: doctor.id,
      ...updates,
    });
  }

  const refreshedDoctor = await db.Doctor.findByPk(id, {
    include: [
      { model: db.User, as: 'user', attributes: { exclude: ['password'] } },
      { model: db.Department, as: 'department' },
      { model: db.DoctorSchedule, as: 'doctorSchedule' },
    ],
  });

  return res.status(200).json({
    status: 'success',
    message: 'Doctor availability updated successfully',
    data: refreshedDoctor,
  });
});

const updateDoctorClinicMode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    runningLate,
    delayMinutes = 15,
    date,
  } = req.body;

  const doctor = await findByPkOr404(db.Doctor, id, 'Doctor', {
    include: [
      { model: db.User, as: 'user', attributes: { exclude: ['password'] } },
      { model: db.DoctorSchedule, as: 'doctorSchedule' },
    ],
  });

  if (req.user.role === 'Doctor' && doctor.userId !== req.user.id) {
    return res.status(403).json({ status: 'error', message: 'Forbidden - You can only update your own clinic mode' });
  }

  let schedule = doctor.doctorSchedule;
  if (!schedule) {
    schedule = await db.DoctorSchedule.create({ doctorId: doctor.id });
  }

  const safeDelay = Math.max(Number(delayMinutes) || 0, 0);
  await schedule.update({
    runningLate: Boolean(runningLate),
    lateDelayMinutes: Boolean(runningLate) ? safeDelay : 0,
    lateUpdatedAt: new Date(),
  });

  const shiftedAppointments = [];
  if (Boolean(runningLate) && safeDelay > 0) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const appointments = await db.Appointment.findAll({
      where: {
        doctorId: doctor.id,
        appointmentDate: {
          [Op.gte]: dayStart,
          [Op.lt]: dayEnd,
        },
        status: {
          [Op.in]: ['Scheduled', 'Rescheduled'],
        },
      },
      include: [{ model: db.Patient, as: 'patient' }],
      order: [['startTime', 'ASC']],
    });

    for (const appointment of appointments) {
      const newStart = shiftTime(appointment.startTime, safeDelay);
      const newEnd = shiftTime(appointment.endTime, safeDelay);
      await appointment.update({
        startTime: newStart,
        endTime: newEnd,
        notes: `${appointment.notes || ''}\n[Clinic mode] ETA shifted by ${safeDelay} minutes.`.trim(),
      });
      shiftedAppointments.push({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        from: `${normalizeTime(appointment.startTime)}-${normalizeTime(appointment.endTime)}`,
        to: `${newStart}-${newEnd}`,
      });

      const patientUser = appointment.patient?.email
        ? await db.User.findOne({ where: { email: appointment.patient.email } })
        : null;
      if (patientUser) {
        await createNotificationsForUsers([patientUser.id], {
          title: 'Doctor Running Late',
          message: `Your appointment time was updated to ${newStart}-${newEnd}.`,
          type: 'Appointment',
          relatedId: appointment.id,
        });
      }
    }
  }

  return res.status(200).json({
    status: 'success',
    message: Boolean(runningLate) ? 'Clinic mode set to running late' : 'Clinic mode reset to on time',
    data: {
      doctorId: doctor.id,
      runningLate: Boolean(runningLate),
      delayMinutes: Boolean(runningLate) ? safeDelay : 0,
      shiftedAppointments,
    },
  });
});

module.exports = {
  getDoctors,
  createDoctor,
  updateDoctorAvailability,
  updateDoctorClinicMode,
};
