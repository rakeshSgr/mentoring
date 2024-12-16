'use strict'
/** @type {import('sequelize-cli').Migration} */

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('report_queries', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			report_code: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			query: {
				type: Sequelize.TEXT,
			},
			status: {
				type: Sequelize.STRING,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.fn('NOW'),
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.fn('NOW'),
			},
			deleted_at: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.fn('NOW'),
			},
		})

		// Add an index on `report_id` to improve query performance
		await queryInterface.addIndex('report_queries', {
			fields: ['report_id'],
			name: 'idx_report_queries_report_id',
		})
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('report_queries')
	},
}
