module.exports = (sequelize, DataTypes) => {
  const DoctorLoadForecast = sequelize.define(
    'DoctorLoadForecast',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      forecast_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      doctor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      predicted_appointments: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'doctor_load_forecast',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false,
    }
  );

  DoctorLoadForecast.associate = (models) => {
    DoctorLoadForecast.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor',
    });
  };

  return DoctorLoadForecast;
};
