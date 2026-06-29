const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Admission = require('./Admission');
const User = require('./User');

class DischargePathway extends Model {}

DischargePathway.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    admissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Admission,
        key: 'id',
      },
      unique: true,
    },
    checklist: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [
        { key: 'final_round', label: 'Final doctor round', done: false },
        { key: 'billing_clearance', label: 'Billing clearance', done: false },
        { key: 'medication_counseling', label: 'Medication counseling', done: false },
        { key: 'followup_instructions', label: 'Follow-up instructions shared', done: false },
      ],
    },
    status: {
      type: DataTypes.ENUM('In Progress', 'Ready for Discharge', 'Discharged'),
      defaultValue: 'In Progress',
    },
    expectedDischargeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ownerUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'DischargePathway',
    tableName: 'discharge_pathways',
    indexes: [{ fields: ['status'] }, { fields: ['admission_id'] }],
  }
);

DischargePathway.belongsTo(Admission, { foreignKey: 'admissionId', as: 'admission' });
Admission.hasOne(DischargePathway, { foreignKey: 'admissionId', as: 'dischargePathway' });

DischargePathway.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });
User.hasMany(DischargePathway, { foreignKey: 'ownerUserId', as: 'ownedDischargePathways' });

module.exports = DischargePathway;
