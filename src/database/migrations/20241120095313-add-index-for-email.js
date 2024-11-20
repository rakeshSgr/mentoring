'use strict'
module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			await queryInterface.addIndex('user_extensions', ['email'])
		} catch (error) {
			console.error('Migration failed to add index', error)
			throw error
		}
	},
	down: async (queryInterface) => {
		try {
			await queryInterface.removeIndex('user_extensions', 'email')
		} catch (error) {
			console.error('Migration failed remove the index', error)
			throw error
		}
	},
}
