const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Appointment = require('./Appointment');
const Bill = require('./Bill');

class AppointmentBillingLink extends Model {}

AppointmentBillingLink.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: Appointment,
        key: 'id',
      },
    },
    billId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Bill,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('DraftGenerated', 'Reviewed', 'Finalized'),
      defaultValue: 'DraftGenerated',
    },
    checklist: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        insuranceVerified: false,
        discountsReviewed: false,
        testsIncluded: false,
      },
    },
  },
  {
    sequelize,
    modelName: 'AppointmentBillingLink',
    tableName: 'appointment_billing_links',
    indexes: [
      { unique: true, fields: ['appointment_id'] },
      { fields: ['bill_id'] },
      { fields: ['status'] },
    ],
  }
);

AppointmentBillingLink.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
AppointmentBillingLink.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });
Appointment.hasOne(AppointmentBillingLink, { foreignKey: 'appointmentId', as: 'billingLink' });
Bill.hasOne(AppointmentBillingLink, { foreignKey: 'billId', as: 'appointmentLink' });

module.exports = AppointmentBillingLink;