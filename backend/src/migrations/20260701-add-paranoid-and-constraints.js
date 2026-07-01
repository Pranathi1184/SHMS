'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add deletedAt columns for soft-delete on clinical/financial tables
    const tables = [
      'patients',
      'appointments',
      'ehr',
      'laboratory_tests',
      'prescriptions',
      'prescription_items',
      'bills',
      'bill_items',
      'admissions',
      'claims',
      'insurance',
    ];

    for (const table of tables) {
      const tableDesc = await queryInterface.describeTable(table).catch(() => null);
      if (tableDesc && !tableDesc.deletedAt && !tableDesc.deleted_at) {
        await queryInterface.addColumn(table, 'deleted_at', {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        });
      }
    }

    // Replace unique indexes with partial unique indexes (WHERE deleted_at IS NULL)
    // so soft-deleted records don't block re-registration
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS patients_email_unique;
      CREATE UNIQUE INDEX patients_email_unique ON patients (email) WHERE deleted_at IS NULL;

      DROP INDEX IF EXISTS bills_bill_number_unique;
      CREATE UNIQUE INDEX bills_bill_number_unique ON bills (bill_number) WHERE deleted_at IS NULL;

      DROP INDEX IF EXISTS insurance_policy_number_unique;
      CREATE UNIQUE INDEX insurance_policy_number_unique ON insurance (policy_number) WHERE deleted_at IS NULL;
    `).catch(() => {});

    // Add token_blacklist table
    await queryInterface.createTable('token_blacklist', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    }).catch(() => {});

    // Add CHECK constraints for financial amounts
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bill_total_non_negative') THEN
          ALTER TABLE bills ADD CONSTRAINT chk_bill_total_non_negative CHECK (total_amount >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bill_net_non_negative') THEN
          ALTER TABLE bills ADD CONSTRAINT chk_bill_net_non_negative CHECK (net_amount >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bill_discount_non_negative') THEN
          ALTER TABLE bills ADD CONSTRAINT chk_bill_discount_non_negative CHECK (discount >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bill_item_quantity_positive') THEN
          ALTER TABLE bill_items ADD CONSTRAINT chk_bill_item_quantity_positive CHECK (quantity > 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bill_item_unit_price_non_negative') THEN
          ALTER TABLE bill_items ADD CONSTRAINT chk_bill_item_unit_price_non_negative CHECK (unit_price >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_claim_amount_positive') THEN
          ALTER TABLE claims ADD CONSTRAINT chk_claim_amount_positive CHECK (claim_amount > 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bed_price_non_negative') THEN
          ALTER TABLE beds ADD CONSTRAINT chk_bed_price_non_negative CHECK (price_per_day >= 0);
        END IF;
      EXCEPTION WHEN others THEN
        NULL;
      END $$;
    `).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      'patients',
      'appointments',
      'ehr',
      'laboratory_tests',
      'prescriptions',
      'prescription_items',
      'bills',
      'bill_items',
      'admissions',
      'claims',
      'insurance',
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, 'deleted_at').catch(() => {});
    }

    // Restore original unique indexes
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS patients_email_unique;
      CREATE UNIQUE INDEX patients_email_unique ON patients (email);

      DROP INDEX IF EXISTS bills_bill_number_unique;
      CREATE UNIQUE INDEX bills_bill_number_unique ON bills (bill_number);

      DROP INDEX IF EXISTS insurance_policy_number_unique;
      CREATE UNIQUE INDEX insurance_policy_number_unique ON insurance (policy_number);
    `).catch(() => {});

    await queryInterface.dropTable('token_blacklist').catch(() => {});

    await queryInterface.sequelize.query(`
      ALTER TABLE bills DROP CONSTRAINT IF EXISTS chk_bill_total_non_negative;
      ALTER TABLE bills DROP CONSTRAINT IF EXISTS chk_bill_net_non_negative;
      ALTER TABLE bills DROP CONSTRAINT IF EXISTS chk_bill_discount_non_negative;
      ALTER TABLE bill_items DROP CONSTRAINT IF EXISTS chk_bill_item_quantity_positive;
      ALTER TABLE bill_items DROP CONSTRAINT IF EXISTS chk_bill_item_unit_price_non_negative;
      ALTER TABLE claims DROP CONSTRAINT IF EXISTS chk_claim_amount_positive;
      ALTER TABLE beds DROP CONSTRAINT IF EXISTS chk_bed_price_non_negative;
    `).catch(() => {});
  },
};
