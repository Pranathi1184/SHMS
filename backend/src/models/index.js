const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const User = require('./User');
const Department = require('./Department');
const Doctor = require('./Doctor');
const DoctorSchedule = require('./DoctorSchedule');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const WaitlistEntry = require('./WaitlistEntry');
const AppointmentBillingLink = require('./AppointmentBillingLink');
const EHR = require('./EHR');
const LaboratoryTest = require('./LaboratoryTest');
const Medicine = require('./Medicine');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const Insurance = require('./Insurance');
const Bill = require('./Bill');
const BillItem = require('./BillItem');
const Ward = require('./Ward');
const Bed = require('./Bed');
const Admission = require('./Admission');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Claim = require('./Claim');
const DischargePathway = require('./DischargePathway');
const CommunicationLog = require('./CommunicationLog');
const PatientDocument = require('./PatientDocument');
const TokenBlacklist = require('./TokenBlacklist');
const NoShowPrediction = require('./NoShowPrediction')(sequelize, DataTypes);
const DoctorLoadForecast = require('./DoctorLoadForecast')(sequelize, DataTypes);
const MedicineDemandForecast = require('./MedicineDemandForecast')(sequelize, DataTypes);
const BedOccupancyForecast = require('./BedOccupancyForecast')(sequelize, DataTypes);
const BillingRiskScore = require('./BillingRiskScore')(sequelize, DataTypes);

const db = {
  sequelize,
  User,
  Department,
  Doctor,
  DoctorSchedule,
  Patient,
  Appointment,
  WaitlistEntry,
  AppointmentBillingLink,
  EHR,
  LaboratoryTest,
  Medicine,
  Prescription,
  PrescriptionItem,
  Insurance,
  Bill,
  BillItem,
  Ward,
  Bed,
  Admission,
  Notification,
  AuditLog,
  Claim,
  DischargePathway,
  CommunicationLog,
  PatientDocument,
  TokenBlacklist,
  NoShowPrediction,
  DoctorLoadForecast,
  MedicineDemandForecast,
  BedOccupancyForecast,
  BillingRiskScore,
};

Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

module.exports = db;
