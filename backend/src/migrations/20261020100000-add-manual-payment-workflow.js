'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'event_registration_id', {
      type: Sequelize.BIGINT.UNSIGNED, allowNull: true, unique: true,
      references: { model: 'event_registrations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('payments', 'purpose', { type: Sequelize.ENUM('MEMBERSHIP', 'EVENT'), allowNull: false, defaultValue: 'MEMBERSHIP' });
    await queryInterface.addColumn('invoices', 'event_registration_id', {
      type: Sequelize.BIGINT.UNSIGNED, allowNull: true, unique: true,
      references: { model: 'event_registrations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
    await queryInterface.changeColumn('invoices', 'membership_type', {
      type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'STUDENT'), allowNull: true,
    });
    await queryInterface.addColumn('invoices', 'description', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('invoices', 'period_start', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn('invoices', 'period_end', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn('events', 'is_free', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    await queryInterface.addColumn('events', 'member_price', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('events', 'non_member_price', { type: Sequelize.DECIMAL(10, 2), allowNull: true });
    await queryInterface.addColumn('event_registrations', 'amount_due', { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn('event_registrations', 'payment_status', { type: Sequelize.ENUM('NOT_REQUIRED', 'AWAITING_PAYMENT', 'SUBMITTED', 'PAID', 'REJECTED'), allowNull: false, defaultValue: 'NOT_REQUIRED' });
    await queryInterface.addColumn('event_registrations', 'currency', { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'SGD' });
    await queryInterface.addColumn('event_registrations', 'ticket_uid', { type: Sequelize.STRING(64), allowNull: true, unique: true });
    await queryInterface.addColumn('event_registrations', 'checked_in_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.createTable('payment_submissions', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      payment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'payments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      payment_method: { type: Sequelize.ENUM('BANK_TRANSFER', 'PAYNOW'), allowNull: false },
      transaction_reference: { type: Sequelize.STRING(100), allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      transfer_date: { type: Sequelize.DATEONLY, allowNull: false },
      proof_storage_key: { type: Sequelize.STRING(100), allowNull: false },
      proof_original_name: { type: Sequelize.STRING(255), allowNull: false },
      proof_mime_type: { type: Sequelize.STRING(100), allowNull: false },
      proof_size: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      status: { type: Sequelize.ENUM('SUBMITTED', 'VERIFIED', 'REJECTED'), allowNull: false, defaultValue: 'SUBMITTED' },
      review_reason: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('payment_submissions', ['payment_id', 'created_at'], { name: 'idx_payment_submissions_payment_created' });
    await queryInterface.addIndex('payments', ['application_id'], { unique: true, name: 'uq_payments_application' });
    await queryInterface.addIndex('invoices', ['payment_id'], { unique: true, name: 'uq_invoices_payment' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_submissions');
    await queryInterface.removeIndex('invoices', 'uq_invoices_payment');
    await queryInterface.removeIndex('payments', 'uq_payments_application');
    await queryInterface.removeColumn('event_registrations', 'checked_in_at');
    await queryInterface.removeColumn('event_registrations', 'payment_status');
    await queryInterface.removeColumn('event_registrations', 'ticket_uid');
    await queryInterface.removeColumn('event_registrations', 'currency');
    await queryInterface.removeColumn('event_registrations', 'amount_due');
    await queryInterface.removeColumn('events', 'non_member_price');
    await queryInterface.removeColumn('events', 'member_price');
    await queryInterface.removeColumn('events', 'is_free');
    await queryInterface.removeColumn('invoices', 'period_end');
    await queryInterface.removeColumn('invoices', 'period_start');
    await queryInterface.removeColumn('invoices', 'description');
    await queryInterface.changeColumn('invoices', 'membership_type', { type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'STUDENT'), allowNull: false });
    await queryInterface.removeColumn('invoices', 'event_registration_id');
    await queryInterface.removeColumn('payments', 'purpose');
    await queryInterface.removeColumn('payments', 'event_registration_id');
  },
};
