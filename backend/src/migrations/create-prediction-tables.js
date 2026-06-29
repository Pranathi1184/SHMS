module.exports = {
  async up(queryInterface, Sequelize) {
    // Create no_show_predictions table
    await queryInterface.createTable('no_show_predictions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      appointment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'appointments',
          key: 'id',
        },
      },
      score_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      risk_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Risk score 0-1, where 1 is highest risk',
      },
      risk_label: {
        type: Sequelize.ENUM('Low', 'Medium', 'High'),
        allowNull: false,
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('no_show_predictions', ['appointment_id']);
    await queryInterface.addIndex('no_show_predictions', ['score_date']);
    await queryInterface.addIndex('no_show_predictions', ['risk_label']);

    // Create doctor_load_forecast table
    await queryInterface.createTable('doctor_load_forecasts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      forecast_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id',
        },
      },
      predicted_appointments: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Predicted number of appointments for the doctor on this date',
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('doctor_load_forecasts', ['doctor_id']);
    await queryInterface.addIndex('doctor_load_forecasts', ['forecast_date']);

    // Create medicine_demand_forecasts table
    await queryInterface.createTable('medicine_demand_forecasts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'medicines',
          key: 'id',
        },
      },
      medicine_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Format: YYYY-MM',
      },
      predicted_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Predicted demand quantity for the month',
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Model confidence 0-1',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('medicine_demand_forecasts', ['medicine_id']);
    await queryInterface.addIndex('medicine_demand_forecasts', ['month']);

    // Create bed_occupancy_forecasts table
    await queryInterface.createTable('bed_occupancy_forecasts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      forecast_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ward_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Ward type: General, ICU, Pediatrics, etc.',
      },
      predicted_occupancy_rate: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Predicted occupancy percentage 0-100',
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Model confidence 0-1',
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('bed_occupancy_forecasts', ['forecast_date']);
    await queryInterface.addIndex('bed_occupancy_forecasts', ['ward_type']);

    // Create billing_risk_scores table
    await queryInterface.createTable('billing_risk_scores', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bill_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bills',
          key: 'id',
        },
      },
      score_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      risk_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Risk score 0-1, where 1 is highest payment risk',
      },
      risk_label: {
        type: Sequelize.ENUM('Low', 'Medium', 'High'),
        allowNull: false,
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('billing_risk_scores', ['bill_id']);
    await queryInterface.addIndex('billing_risk_scores', ['score_date']);
    await queryInterface.addIndex('billing_risk_scores', ['risk_label']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('billing_risk_scores', { force: true });
    await queryInterface.dropTable('bed_occupancy_forecasts', { force: true });
    await queryInterface.dropTable('medicine_demand_forecasts', { force: true });
    await queryInterface.dropTable('doctor_load_forecasts', { force: true });
    await queryInterface.dropTable('no_show_predictions', { force: true });
  },
};
