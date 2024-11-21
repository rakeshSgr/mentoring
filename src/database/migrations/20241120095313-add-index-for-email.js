'use strict'
module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			await queryInterface.addIndex('user_extensions', ['email'], {
				unique: true, // This ensures that email must be unique
				name: 'unique_email_index', // Optionally, specify a name for the index
			})
		} catch (error) {
			console.error('Migration failed to add index', error)
			throw error
		}
	},
	down: async (queryInterface) => {
		try {
			await queryInterface.removeIndex('user_extensions', 'unique_email_index')
		} catch (error) {
			console.error('Migration failed remove the index', error)
			throw error
		}
	},
}
