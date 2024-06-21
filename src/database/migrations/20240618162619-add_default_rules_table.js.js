'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('default_rules', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			type: {
				type: Sequelize.STRING,
			},
			target_field: {
				type: Sequelize.STRING,
			},
			is_target_from_sessions_mentor: {
				type: Sequelize.BOOLEAN,
			},
			requester_field: {
				type: Sequelize.STRING,
			},
			field_configs: {
				type: Sequelize.JSON,
			},
			matching_operator: {
				type: Sequelize.STRING,
			},
			requester_roles: {
				type: Sequelize.ARRAY(Sequelize.STRING),
			},
			role_config: {
				type: Sequelize.JSON,
			},
			organization_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				primaryKey: true,
			},
			created_by: {
				type: Sequelize.INTEGER,
			},
			updated_by: {
				type: Sequelize.INTEGER,
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
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('default_rules')
	},
}
