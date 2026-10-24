'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Query the SUPER_ADMIN role id
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const superAdminRoleId = roles[0]?.id || 1;
    const passwordHash = await bcrypt.hash('Admin@1234', 10);

    // Check if admin user already exists
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@wista.sg' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!existing || existing.length === 0) {
      await queryInterface.bulkInsert('users', [
        {
          first_name: 'Super',
          last_name: 'Admin',
          email: 'admin@wista.sg',
          password_hash: passwordHash,
          token_version: 0,
          status: 'ACTIVE',
          role_id: superAdminRoleId,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'admin@wista.sg',
    });
  },
};
