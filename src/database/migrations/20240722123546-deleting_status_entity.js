'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Update entities with value 'PUBLISHED' to 'Upcoming'
		await queryInterface.bulkDelete('entities', { label: 'Unfulfilled' }, { value: 'UNFULFILLED' })
	},

	async down(queryInterface, Sequelize) {
		// Revert the update if needed (rollback)
		await queryInterface.bulkUpdate('entities', { label: 'Unfulfilled' }, { value: 'UNFULFILLED' })
	},
}
