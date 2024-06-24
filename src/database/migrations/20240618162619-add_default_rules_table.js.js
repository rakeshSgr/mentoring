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
				allowNull: false,
			},
			target_field: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			is_target_from_sessions_mentor: {
				type: Sequelize.BOOLEAN,
			},
			requester_field: {
				type: Sequelize.STRING,
				allowNull: false,
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

		// Add indexes to improve performance
		await queryInterface.addIndex('default_rules', ['type'])
		await queryInterface.addIndex('default_rules', ['organization_id'])
		await queryInterface.addIndex('default_rules', ['type', 'organization_id'])

		// Add a unique constraint to prevent duplicate rules
		await queryInterface.addConstraint('default_rules', {
			fields: ['type', 'target_field', 'requester_field', 'organization_id'],
			type: 'unique',
			name: 'unique_default_rules_constraint',
		})
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeConstraint('default_rules', 'unique_default_rules_constraint')

		await queryInterface.removeIndex('default_rules', ['type'])
		await queryInterface.removeIndex('default_rules', ['organization_id'])
		await queryInterface.removeIndex('default_rules', ['type', 'organization_id'])

		await queryInterface.dropTable('default_rules')
	},
}
