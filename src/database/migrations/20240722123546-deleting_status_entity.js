'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Delete entities with label 'Unfulfilled' and value 'UNFULFILLED'
		await queryInterface.bulkDelete('entities', { label: 'Unfulfilled', value: 'UNFULFILLED' }, {})
	},

	async down(queryInterface, Sequelize) {
		// Revert the deletion if needed (rollback)
		await queryInterface.bulkInsert('entities', { label: 'Unfulfilled', value: 'UNFULFILLED' }, {})
	},
}
