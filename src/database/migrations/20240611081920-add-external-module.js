'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const newModule = {
				code: 'external',
				status: 'ACTIVE',
				created_at: new Date(),
				updated_at: new Date(),
			}
			await queryInterface.bulkInsert('modules', [newModule], {})
		} catch (error) {
			console.error('An error occurred during the migration: ', error.message)
			throw error
		}
	},

	down: async (queryInterface, Sequelize) => {
		try {
			await queryInterface.bulkDelete('modules', { code: 'external' }, {})
		} catch (error) {
			console.error('An error occurred during the migration rollback: ', error.message)
			throw error
		}
	},
}
