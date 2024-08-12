'use strict'

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			await queryInterface.changeColumn('sessions', 'categories', {
				type: Sequelize.ARRAY(Sequelize.STRING),
				allowNull: true,
			})
		} catch (error) {
			console.error(error)
		}
	},
	down: async (queryInterface, Sequelize) => {
		await queryInterface.changeColumn('sessions', 'recommended_for', {
			type: Sequelize.ARRAY(Sequelize.STRING),
			allowNull: false,
		})
	},
}
