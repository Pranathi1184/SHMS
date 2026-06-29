module.exports = (sequelize, DataTypes) => {
  const BillingRiskScore = sequelize.define(
    'BillingRiskScore',
    {
      bill_id: {
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
        comment: 'Risk score 0-1, where 1 is highest payment risk',
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
      tableName: 'billing_risk_scores',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false,
    }
  );

  BillingRiskScore.associate = (models) => {
    BillingRiskScore.belongsTo(models.Bill, {
      foreignKey: 'bill_id',
      as: 'bill',
    });
  };

  return BillingRiskScore;
};
