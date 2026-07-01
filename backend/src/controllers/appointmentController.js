const { Op } = require('sequelize');
const logger = require('../utils/logger');
const db = require('../models');
const { createNotificationsForUsers } = require('../services/notificationService');
const sequelize = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const { findByPkOr404, getLinkedPatientForUser, generateBillNumber } = require('../utils/controllerHelpers');
const { normalizeTime, toMinutes, formatMinutes } = require('../utils/timeUtils');

const DEFAULT_AVAILABLE_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '17:00';
const DEFAULT_SLOT_DURATION = 30;

const getDateRange = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const resolveDoctorSchedule = (doctor) => {
  const schedule = doctor?.doctorSchedule;
  const availableDays = Array.isArray(schedule?.availableDays) && schedule.availableDays.length
    ? schedule.availableDays
    : DEFAULT_AVAILABLE_DAYS;
  const availableFrom = normalizeTime(schedule?.availableFrom) || DEFAULT_START_TIME;
  const availableTo = normalizeTime(schedule?.availableTo) || DEFAULT_END_TIME;
  const slotDurationMinutes = Number(schedule?.slotDurationMinutes) > 0
    ? Number(schedule.slotDurationMinutes)
    : DEFAULT_SLOT_DURATION;

  return {
    availableDays,
    availableFrom,
    availableTo,
    slotDurationMinutes,
  };
};

const isWithinDoctorSchedule = (schedule, dateValue, startTime, endTime) => {
  const day = new Date(dateValue).getDay();
  if (!schedule.availableDays.includes(day)) {
    return {
      valid: false,
      reason: 'Doctor is not available on the selected day.',
    };
  }

  if (!startTime || !endTime) {
    return { valid: true };
  }

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const availableFrom = toMinutes(schedule.availableFrom);
  const availableTo = toMinutes(schedule.availableTo);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return {
      valid: false,
      reason: 'Invalid appointment time.',
    };
  }

  if (end <= start) {
    return {
      valid: false,
      reason: 'End time must be later than start time.',
    };
  }

  if (start < availableFrom || end > availableTo) {
    return {
      valid: false,
      reason: `Doctor works between ${schedule.availableFrom} and ${schedule.availableTo}.`,
    };
  }

  return { valid: true };
};

const slotsOverlap = (candidateStart, candidateEnd, slotStart, slotEnd) => {
  return candidateStart < slotEnd && slotStart < candidateEnd;
};

const loadBookedSlots = async (doctorId, dateValue, excludeAppointmentId = null) => {
  const { start, end } = getDateRange(dateValue);
  const where = {
    doctorId,
    appointmentDate: {
      [Op.gte]: start,
      [Op.lt]: end,
    },
    status: {
      [Op.ne]: 'Cancelled',
    },
  };

  if (excludeAppointmentId) {
    where.id = { [Op.ne]: excludeAppointmentId };
  }

  const appointments = await db.Appointment.findAll({
    where,
    order: [['startTime', 'ASC']],
  });

  return appointments.map((apt) => ({
    startTime: normalizeTime(apt.startTime),
    endTime: normalizeTime(apt.endTime),
  }));
};

const patientHasOverlappingAppointment = async ({ patientId, appointmentDate, startTime, endTime, excludeAppointmentId = null }) => {
  const { start, end } = getDateRange(appointmentDate);
  const where = {
    patientId,
    appointmentDate: {
      [Op.gte]: start,
      [Op.lt]: end,
    },
    status: {
      [Op.ne]: 'Cancelled',
    },
  };

  if (excludeAppointmentId) {
    where.id = { [Op.ne]: excludeAppointmentId };
  }

  const appointments = await db.Appointment.findAll({
    where,
    attributes: ['id', 'startTime', 'endTime'],
  });

  const requestedStart = toMinutes(startTime);
  const requestedEnd = toMinutes(endTime);
  return appointments.some((apt) => slotsOverlap(requestedStart, requestedEnd, toMinutes(normalizeTime(apt.startTime)), toMinutes(normalizeTime(apt.endTime))));
};

const generateSuggestionsForDate = (dateValue, schedule, bookedSlots, durationMinutes, maxSuggestions = 3) => {
  const suggestions = [];
  const day = new Date(dateValue).getDay();
  if (!schedule.availableDays.includes(day)) {
    return suggestions;
  }

  const windowStart = toMinutes(schedule.availableFrom);
  const windowEnd = toMinutes(schedule.availableTo);
  const step = schedule.slotDurationMinutes;

  for (let pointer = windowStart; pointer + durationMinutes <= windowEnd; pointer += step) {
    const candidateStart = pointer;
    const candidateEnd = pointer + durationMinutes;

    const blocked = bookedSlots.some((slot) => {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      return slotsOverlap(candidateStart, candidateEnd, slotStart, slotEnd);
    });

    if (!blocked) {
      suggestions.push({
        date: new Date(dateValue).toISOString().split('T')[0],
        start: formatMinutes(candidateStart),
        end: formatMinutes(candidateEnd),
      });
    }

    if (suggestions.length >= maxSuggestions) {
      break;
    }
  }

  return suggestions;
};

const findNextSuggestedSlots = async (doctor, dateValue, durationMinutes, maxSuggestions = 3) => {
  const schedule = resolveDoctorSchedule(doctor);
  const baseDate = new Date(dateValue);
  baseDate.setHours(0, 0, 0, 0);

  const suggestions = [];
  for (let dayOffset = 0; dayOffset < 14 && suggestions.length < maxSuggestions; dayOffset += 1) {
    const candidateDate = new Date(baseDate);
    candidateDate.setDate(baseDate.getDate() + dayOffset);
    const candidateDateISO = candidateDate.toISOString().split('T')[0];
    const bookedSlots = await loadBookedSlots(doctor.id, candidateDateISO);
    const picks = generateSuggestionsForDate(candidateDateISO, schedule, bookedSlots, durationMinutes, maxSuggestions - suggestions.length);
    suggestions.push(...picks);
  }

  return suggestions;
};

const timeInWindow = (candidateStart, candidateEnd, fromMinutes, toMinutesVal) => {
  return candidateStart >= fromMinutes && candidateEnd <= toMinutesVal;
};

const getUserForPatient = async (patientId) => {
  const patient = await db.Patient.findByPk(patientId);
  if (!patient?.email) {
    return null;
  }
  return db.User.findOne({ where: { email: patient.email } });
};

const ensureWaitlistEntry = async ({ patientId, doctorId, appointmentDate, startTime, endTime, createdBy }) => {
  const existing = await db.WaitlistEntry.findOne({
    where: {
      patientId,
      doctorId,
      preferredDate: appointmentDate,
      preferredStartTime: startTime,
      preferredEndTime: endTime,
      status: 'Active',
    },
  });

  if (existing) {
    return existing;
  }

  return db.WaitlistEntry.create({
    patientId,
    doctorId,
    preferredDate: appointmentDate,
    preferredStartTime: startTime,
    preferredEndTime: endTime,
    status: 'Active',
    createdBy,
    notes: 'Auto-added when requested slot was unavailable',
  });
};

const notifyWaitlistMatches = async (doctorId, date, startTime, endTime) => {
  const waitlistItems = await db.WaitlistEntry.findAll({
    where: {
      doctorId,
      preferredDate: date,
      status: 'Active',
      notifiedAt: null,
    },
    order: [['createdAt', 'ASC']],
  });

  const slotStart = toMinutes(startTime);
  const slotEnd = toMinutes(endTime);

  for (const item of waitlistItems) {
    const preferredStart = toMinutes(normalizeTime(item.preferredStartTime));
    const preferredEnd = toMinutes(normalizeTime(item.preferredEndTime));
    const matches = slotsOverlap(slotStart, slotEnd, preferredStart, preferredEnd);
    if (!matches) continue;

    const patientUser = await getUserForPatient(item.patientId);
    if (patientUser) {
      await createNotificationsForUsers([patientUser.id], {
        title: 'Waitlist Slot Available',
        message: `A matching slot opened on ${date} (${startTime}-${endTime}). Book now from Appointments.`,
        type: 'Appointment',
      });
    }

    await item.update({ status: 'Matched', notifiedAt: new Date() });
    break;
  }
};

const ensureDraftBillForCompletedAppointment = async (appointmentId, actingUserId) => {
  try {
    const existingLink = await db.AppointmentBillingLink.findOne({ where: { appointmentId } });
    if (existingLink) {
      return;
    }

    const appointment = await db.Appointment.findByPk(appointmentId, {
      include: [
        { model: db.Patient, as: 'patient' },
        { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
      ],
    });
    if (!appointment) {
      return;
    }

    const consultationFee = Number(appointment.doctor?.consultationFee || 0);
    const billNumber = generateBillNumber('AUTO');
    const autoNotes = `Auto-generated draft from completed appointment ${appointment.id}`;

    const bill = await db.Bill.create({
      patientId: appointment.patientId,
      billNumber,
      billDate: new Date(),
      totalAmount: consultationFee,
      discount: 0,
      taxAmount: 0,
      netAmount: consultationFee,
      paymentMode: 'Other',
      paymentStatus: 'Pending',
      notes: autoNotes,
      createdBy: actingUserId,
    });

    await db.BillItem.create({
      billId: bill.id,
      description: `Consultation fee (${appointment.doctor?.user?.firstName || 'Doctor'})`,
      quantity: 1,
      unitPrice: consultationFee,
      totalPrice: consultationFee,
    });

    await db.AppointmentBillingLink.create({
      appointmentId,
      billId: bill.id,
      status: 'DraftGenerated',
      checklist: {
        insuranceVerified: false,
        discountsReviewed: false,
        testsIncluded: false,
      },
    });

    const billingUsers = await db.User.findAll({ where: { role: 'Billing Staff', isActive: true } });
    await createNotificationsForUsers(
      billingUsers.map((user) => user.id),
      {
        title: 'Draft Bill Created',
        message: `Draft bill ${billNumber} created from completed appointment. Please review checklist.`,
        type: 'Bill',
        relatedId: bill.id,
      }
    );
  } catch (error) {
    logger.error('Failed to create draft bill for completed appointment', {
      appointmentId,
      message: error.message,
      stack: error.stack,
    });
  }
};

const checkAvailability = asyncHandler(async (req, res) => {
  const { doctorId, date, startTime, endTime } = req.query;
  const doctor = await findByPkOr404(db.Doctor, doctorId, 'Doctor', {
    include: [{ model: db.DoctorSchedule, as: 'doctorSchedule' }],
  });

  const schedule = resolveDoctorSchedule(doctor);
  const bookedSlots = await loadBookedSlots(doctorId, date);

  let available = true;
  let message = 'Selected slot is available for booking.';
  let requestedDuration = schedule.slotDurationMinutes;

  if (startTime && endTime) {
    const scheduleCheck = isWithinDoctorSchedule(schedule, date, startTime, endTime);
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      requestedDuration = end - start;
    }

    if (!scheduleCheck.valid) {
      available = false;
      message = scheduleCheck.reason;
    } else {
      const overlaps = bookedSlots.some((slot) => {
        return slotsOverlap(start, end, toMinutes(slot.startTime), toMinutes(slot.endTime));
      });

      if (overlaps) {
        available = false;
        message = 'Selected slot overlaps with an existing appointment.';
      }
    }
  }

  const suggestedSlots = await findNextSuggestedSlots(doctor, date, requestedDuration, 3);

  res.status(200).json({
    status: 'success',
    data: {
      available,
      message,
      doctorSchedule: schedule,
      bookedSlots,
      suggestedSlots,
    },
  });
});

const getAvailableDoctors = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.query;

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return res.status(400).json({ status: 'error', message: 'Invalid time range' });
  }

  const doctors = await db.Doctor.findAll({
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

  const { start: dayStart, end: dayEnd } = getDateRange(date);
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

  const bookedByDoctor = appointments.reduce((acc, appointment) => {
    const key = appointment.doctorId;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      startTime: normalizeTime(appointment.startTime),
      endTime: normalizeTime(appointment.endTime),
    });
    return acc;
  }, {});

  const availableDoctors = doctors.filter((doctor) => {
    const schedule = resolveDoctorSchedule(doctor);
    const scheduleCheck = isWithinDoctorSchedule(schedule, date, startTime, endTime);
    if (!scheduleCheck.valid) {
      return false;
    }

    const doctorSlots = bookedByDoctor[doctor.id] || [];
    const hasOverlap = doctorSlots.some((slot) => {
      return slotsOverlap(start, end, toMinutes(slot.startTime), toMinutes(slot.endTime));
    });
    return !hasOverlap;
  });

  return res.status(200).json({
    status: 'success',
    data: {
      doctors: availableDoctors,
    },
  });
});

const findBestSlots = asyncHandler(async (req, res) => {
  const {
    date,
    fromTime,
    toTime,
    departmentId,
    preferredDoctorId,
    durationMinutes = 30,
  } = req.query;

  const fromMinutes = toMinutes(fromTime);
  const toMinutesValue = toMinutes(toTime);
  const duration = Number(durationMinutes);
  if (!Number.isFinite(fromMinutes) || !Number.isFinite(toMinutesValue) || !Number.isFinite(duration) || toMinutesValue <= fromMinutes) {
    return res.status(400).json({ status: 'error', message: 'Invalid slot finder constraints' });
  }

  const where = {};
  if (departmentId) {
    where.departmentId = departmentId;
  }
  if (preferredDoctorId) {
    where.id = preferredDoctorId;
  }

  const doctors = await db.Doctor.findAll({
    where,
    include: [
      { model: db.User, as: 'user', attributes: { exclude: ['password'] } },
      { model: db.Department, as: 'department' },
      { model: db.DoctorSchedule, as: 'doctorSchedule' },
    ],
    order: [
      [{ model: db.User, as: 'user' }, 'firstName', 'ASC'],
    ],
  });

  const results = [];
  for (const doctor of doctors) {
    const schedule = resolveDoctorSchedule(doctor);
    const bookedSlots = await loadBookedSlots(doctor.id, date);
    const picks = generateSuggestionsForDate(date, schedule, bookedSlots, duration, 8)
      .filter((slot) => {
        const s = toMinutes(slot.start);
        const e = toMinutes(slot.end);
        return timeInWindow(s, e, fromMinutes, toMinutesValue);
      })
      .slice(0, 3);

    picks.forEach((slot) => {
      results.push({
        ...slot,
        doctorId: doctor.id,
        doctorName: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
        department: doctor.department?.name || null,
        preferredMatch: preferredDoctorId ? doctor.id === preferredDoctorId : false,
      });
    });
  }

  const topThree = results
    .sort((a, b) => {
      if (a.preferredMatch !== b.preferredMatch) {
        return a.preferredMatch ? -1 : 1;
      }
      return a.start.localeCompare(b.start);
    })
    .slice(0, 3);

  return res.status(200).json({ status: 'success', data: { slots: topThree } });
});

const getPreVisitReadiness = asyncHandler(async (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  const { start: dayStart, end: dayEnd } = getDateRange(targetDate);

  const appointments = await db.Appointment.findAll({
    where: {
      appointmentDate: {
        [Op.gte]: dayStart,
        [Op.lt]: dayEnd,
      },
      status: 'Scheduled',
    },
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }] },
    ],
    order: [['startTime', 'ASC']],
    limit: 40,
  });

  const queue = [];
  for (const appointment of appointments) {
    const recentEhr = await db.EHR.findOne({
      where: {
        patientId: appointment.patientId,
        [Op.or]: [
          { appointmentId: appointment.id },
          {
            createdAt: {
              [Op.gte]: new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)),
            },
          },
        ],
      },
    });

    const pendingTests = await db.LaboratoryTest.count({
      where: {
        patientId: appointment.patientId,
        status: {
          [Op.in]: ['Ordered', 'Sample Collected', 'In Progress'],
        },
      },
    });

    const missingItems = [];
    if (!recentEhr) {
      missingItems.push('Vitals / recent clinical note missing');
    }
    if (pendingTests > 0) {
      missingItems.push(`${pendingTests} pending lab test(s)`);
    }

    queue.push({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim(),
      doctorName: `${appointment.doctor?.user?.firstName || ''} ${appointment.doctor?.user?.lastName || ''}`.trim(),
      time: `${normalizeTime(appointment.startTime)}-${normalizeTime(appointment.endTime)}`,
      readiness: missingItems.length === 0 ? 'Ready' : 'Needs Attention',
      missingItems,
    });
  }

  return res.status(200).json({ status: 'success', data: { queue } });
});

const createAppointment = asyncHandler(async (req, res) => {
  const {
    patientId,
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    notes,
  } = req.body;

  let effectivePatientId = patientId;
  if (req.user.role === 'Patient') {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }
    effectivePatientId = linkedPatient.id;
  }

  await findByPkOr404(db.Patient, effectivePatientId, 'Patient');

  const doctor = await findByPkOr404(db.Doctor, doctorId, 'Doctor', {
    include: [{ model: db.DoctorSchedule, as: 'doctorSchedule' }],
  });

  const schedule = resolveDoctorSchedule(doctor);
  const scheduleCheck = isWithinDoctorSchedule(schedule, appointmentDate, startTime, endTime);
  if (!scheduleCheck.valid) {
    return res.status(400).json({ status: 'error', message: scheduleCheck.reason });
  }

  const bookedSlots = await loadBookedSlots(doctorId, appointmentDate);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const overlap = bookedSlots.some((slot) => {
    return slotsOverlap(start, end, toMinutes(slot.startTime), toMinutes(slot.endTime));
  });

  const patientOverlap = await patientHasOverlappingAppointment({
    patientId: effectivePatientId,
    appointmentDate,
    startTime,
    endTime,
  });

  if (patientOverlap) {
    return res.status(400).json({
      status: 'error',
      message: 'Patient already has an overlapping appointment at this time',
    });
  }

  if (overlap) {
    const suggestedSlots = await findNextSuggestedSlots(doctor, appointmentDate, end - start, 3);
    const waitlistEntry = await ensureWaitlistEntry({
      patientId: effectivePatientId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      createdBy: req.user.id,
    });

    const patientUser = await getUserForPatient(effectivePatientId);
    if (patientUser) {
      await createNotificationsForUsers([patientUser.id], {
        title: 'Added To Smart Waitlist',
        message: `Requested slot is unavailable. You were auto-added to waitlist for ${appointmentDate} ${startTime}-${endTime}.`,
        type: 'Appointment',
        relatedId: waitlistEntry.id,
      });
    }

    return res.status(400).json({
      status: 'error',
      message: 'Time slot is already booked',
      data: { suggestedSlots, waitlistJoined: true },
    });
  }

  const appointment = await db.Appointment.create({
    patientId: effectivePatientId,
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    notes,
    createdBy: req.user.id,
  });

  const populatedAppointment = await db.Appointment.findByPk(appointment.id, {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }, { model: db.Department, as: 'department' }] },
    ],
  });

  await createNotificationsForUsers(
    [req.user.id, populatedAppointment?.doctor?.userId],
    {
      title: 'Appointment Created',
      message: `Appointment booked for ${appointmentDate} ${startTime || ''}`.trim(),
      type: 'Appointment',
      relatedId: appointment.id,
    }
  );

  res.status(201).json({
    status: 'success',
    message: 'Appointment created successfully',
    data: populatedAppointment,
  });
});

const getAppointments = asyncHandler(async (req, res) => {
  const { status, patientId, doctorId, search = '' } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let whereClause = {};
  if (status) whereClause.status = status;
  if (patientId) whereClause.patientId = patientId;
  if (doctorId) whereClause.doctorId = doctorId;

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    const like = `%${normalizedSearch}%`;
    whereClause[Op.or] = [
      { '$patient.firstName$': { [Op.iLike]: like } },
      { '$patient.lastName$': { [Op.iLike]: like } },
      { '$patient.email$': { [Op.iLike]: like } },
      sequelize.where(
        sequelize.fn('concat', sequelize.col('doctor->user.first_name'), ' ', sequelize.col('doctor->user.last_name')),
        { [Op.iLike]: like }
      ),
    ];
  }

  if (req.user.role === 'Patient') {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }
    whereClause.patientId = linkedPatient.id;
  }

  const { count, rows: appointments } = await db.Appointment.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    distinct: true,
    subQuery: false,
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }, { model: db.Department, as: 'department' }] },
    ],
    order: [['appointmentDate', 'DESC'], ['startTime', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: {
      appointments,
      pagination: buildPaginationResponse(count, page, limit),
      filters: {
        search: normalizedSearch || null,
        status: status || null,
      },
    },
  });
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await findByPkOr404(db.Appointment, id, 'Appointment', {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }, { model: db.Department, as: 'department' }] },
      { model: db.User, as: 'creator', attributes: { exclude: ['password'] } },
      { model: db.EHR, as: 'ehrRecords' },
    ],
  });

  if (req.user.role === 'Patient') {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }

    if (appointment.patientId !== linkedPatient.id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
    }
  }

  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    appointmentDate,
    startTime,
    endTime,
    status,
    notes,
  } = req.body;

  const appointment = await findByPkOr404(db.Appointment, id, 'Appointment');

  if ((appointmentDate || startTime || endTime) && appointment.status !== 'Cancelled') {
    const checkDate = appointmentDate || appointment.appointmentDate;
    const checkStart = startTime || appointment.startTime;
    const checkEnd = endTime || appointment.endTime;

    const doctor = await findByPkOr404(db.Doctor, appointment.doctorId, 'Doctor', {
      include: [{ model: db.DoctorSchedule, as: 'doctorSchedule' }],
    });

    const schedule = resolveDoctorSchedule(doctor);
    const scheduleCheck = isWithinDoctorSchedule(schedule, checkDate, checkStart, checkEnd);
    if (!scheduleCheck.valid) {
      return res.status(400).json({ status: 'error', message: scheduleCheck.reason });
    }

    const bookedSlots = await loadBookedSlots(appointment.doctorId, checkDate, id);
    const overlap = bookedSlots.some((slot) => {
      return slotsOverlap(toMinutes(checkStart), toMinutes(checkEnd), toMinutes(slot.startTime), toMinutes(slot.endTime));
    });

    const patientOverlap = await patientHasOverlappingAppointment({
      patientId: appointment.patientId,
      appointmentDate: checkDate,
      startTime: checkStart,
      endTime: checkEnd,
      excludeAppointmentId: id,
    });

    if (patientOverlap) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient already has an overlapping appointment at this time',
      });
    }

    if (overlap) {
      const suggestedSlots = await findNextSuggestedSlots(doctor, checkDate, toMinutes(checkEnd) - toMinutes(checkStart), 3);
      return res.status(400).json({
        status: 'error',
        message: 'Time slot is already booked',
        data: { suggestedSlots },
      });
    }
  }

  const previousStatus = appointment.status;

  await appointment.update({
    appointmentDate,
    startTime,
    endTime,
    status,
    notes,
  });

  if (status === 'Completed' && previousStatus !== 'Completed') {
    await ensureDraftBillForCompletedAppointment(appointment.id, req.user.id);
  }

  const populatedAppointment = await db.Appointment.findByPk(appointment.id, {
    include: [
      { model: db.Patient, as: 'patient' },
      { model: db.Doctor, as: 'doctor', include: [{ model: db.User, as: 'user' }, { model: db.Department, as: 'department' }] },
    ],
  });

  res.status(200).json({
    status: 'success',
    message: 'Appointment updated successfully',
    data: populatedAppointment,
  });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await findByPkOr404(db.Appointment, id, 'Appointment');

  if (req.user.role === 'Patient') {
    const linkedPatient = await getLinkedPatientForUser(req.user);
    if (!linkedPatient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found for this account' });
    }

    if (appointment.patientId !== linkedPatient.id) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Access denied' });
    }
  }

  await appointment.update({ status: 'Cancelled' });

  const cancelledDate = new Date(appointment.appointmentDate).toISOString().split('T')[0];
  await notifyWaitlistMatches(
    appointment.doctorId,
    cancelledDate,
    normalizeTime(appointment.startTime),
    normalizeTime(appointment.endTime)
  );

  await createNotificationsForUsers(
    [req.user.id],
    {
      title: 'Appointment Cancelled',
      message: 'An appointment has been cancelled.',
      type: 'Appointment',
      relatedId: appointment.id,
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Appointment cancelled successfully',
  });
});

module.exports = {
  checkAvailability,
  getAvailableDoctors,
  findBestSlots,
  getPreVisitReadiness,
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
};
