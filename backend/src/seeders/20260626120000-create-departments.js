'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const departments = [
      { name: 'Cardiology', description: 'Heart and cardiovascular care', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Neurology', description: 'Brain and nervous system disorders', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Orthopedics', description: 'Bone, joint, and muscle care', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pediatrics', description: 'Child and infant healthcare', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Dermatology', description: 'Skin care and treatment', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Oncology', description: 'Cancer diagnosis and treatment', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Emergency', description: '24/7 emergency care', createdAt: new Date(), updatedAt: new Date() },
      { name: 'ICU', description: 'Intensive Care Unit', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Radiology', description: 'Medical imaging services', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Laboratory', description: 'Diagnostic testing services', createdAt: new Date(), updatedAt: new Date() },
    ];
    await queryInterface.bulkInsert('departments', departments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('departments', null, {});
  }
};
