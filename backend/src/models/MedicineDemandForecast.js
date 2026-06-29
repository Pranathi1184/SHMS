module.exports = (sequelize, DataTypes) => {
  const MedicineDemandForecast = sequelize.define(
    'MedicineDemandForecast',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      medicine_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      month: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      predicted_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: { min: 0, max: 1 },
      },
    },
    {
      tableName: 'medicine_demand_forecast',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false,
    }
  );

  return MedicineDemandForecast;
};
