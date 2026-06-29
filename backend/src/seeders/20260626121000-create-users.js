'use strict';
const { generateUser } = require('./helpers');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [];

    // Super Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    users.push({
      id: require('uuid').v4(),
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@shms.com',
      password: adminPassword,
      role: 'Administrator',
      phone: '555-123-4567',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5 Administrators
    for (let i = 0; i < 5; i++) {
      const user = await generateUser('Administrator', i + 1);
      users.push(user);
    }

    // 20 Doctors
    for (let i = 0; i < 20; i++) {
      const user = await generateUser('Doctor', i + 1);
      users.push(user);
    }

    // 25 Nurses
    for (let i = 0; i < 25; i++) {
      const user = await generateUser('Nurse', i + 1);
      users.push(user);
    }

    // 10 Receptionists
    for (let i = 0; i < 10; i++) {
      const user = await generateUser('Receptionist', i + 1);
      users.push(user);
    }

    // 10 Lab Technicians
    for (let i = 0; i < 10; i++) {
      const user = await generateUser('Lab Technician', i + 1);
      users.push(user);
    }

    // 8 Pharmacists
    for (let i = 0; i < 8; i++) {
      const user = await generateUser('Pharmacist', i + 1);
      users.push(user);
    }

    // 8 Billing Staff
    for (let i = 0; i < 8; i++) {
      const user = await generateUser('Billing Staff', i + 1);
      users.push(user);
    }

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
