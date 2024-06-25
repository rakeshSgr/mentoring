'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('availabilities', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			user_id: {
				allowNull: false,
				type: Sequelize.INTEGER,
			},
			event_name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			start_time: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			end_time: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			expiration_date: {
				type: Sequelize.BIGINT,
				allowNull: true,
			},
			repeat_on: {
				type: Sequelize.ARRAY(
					Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
				),
				allowNull: true,
				defaultValue: null,
			},
			repeat_unit: {
				type: Sequelize.ENUM('DAY', 'WEEK', 'MONTH', 'YEAR'),
				allowNull: true,
				defaultValue: null,
			},
			occurrence_in_month: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			repeat_increment: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			session_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			updated_by: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			created_by: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			organization_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
				primaryKey: true,
			},
			exceptions: {
				type: Sequelize.JSONB,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			deleted_at: {
				type: Sequelize.DATE,
			},
		})

		// Add index if necessary
		await queryInterface.addIndex('availabilities', ['user_id'])
		await queryInterface.addIndex('availabilities', ['organization_id'])
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.dropTable('availabilities')
		//await queryInterface.query('drop type enum_availabilities_repeat_on[];')
	},
}
