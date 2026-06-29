module.exports = (sequelize, DataTypes) => {
  const NoShowPrediction = sequelize.define(
    'NoShowPrediction',
    {
      appointment_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      score_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      risk_score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: { min: 0, max: 1 },
      },
      risk_label: {
        type: DataTypes.ENUM('Low', 'Medium', 'High'),
        allowNull: false,
      },
      recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'no_show_predictions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false,
    }
  );

  NoShowPrediction.associate = (models) => {
    NoShowPrediction.belongsTo(models.Appointment, {
      foreignKey: 'appointment_id',
      as: 'appointment',
    });
  };

  return NoShowPrediction;
};
