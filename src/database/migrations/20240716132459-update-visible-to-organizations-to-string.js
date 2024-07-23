'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Change visible_to_organizations to STRING and allow NULL
		await queryInterface.changeColumn('mentor_extensions', 'visible_to_organizations', {
			type: Sequelize.ARRAY(Sequelize.STRING),
			allowNull: true,
		})

		await queryInterface.changeColumn('sessions', 'visible_to_organizations', {
			type: Sequelize.ARRAY(Sequelize.STRING),
			allowNull: true,
		})

		await queryInterface.changeColumn('user_extensions', 'visible_to_organizations', {
			type: Sequelize.ARRAY(Sequelize.STRING),
			allowNull: true,
		})
	},

	down: async (queryInterface, Sequelize) => {
		// Revert changes back to INTEGER and disallow NULL
		await queryInterface.changeColumn('mentor_extensions', 'visible_to_organizations', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('sessions', 'visible_to_organizations', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('user_extensions', 'visible_to_organizations', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})
	},
}
