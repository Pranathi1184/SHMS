module.exports = (sequelize, DataTypes) => {
  const BedOccupancyForecast = sequelize.define(
    'BedOccupancyForecast',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ward_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Ward type: General, ICU, Pediatrics, etc.',
      },
      predicted_occupancy_rate: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        validate: { min: 0, max: 100 },
        comment: 'Predicted occupancy percentage 0-100',
      },
    },
    {
      tableName: 'bed_occupancy_forecast',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false,
    }
  );

  return BedOccupancyForecast;
};
