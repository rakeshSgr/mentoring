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
				defaultValue: false,
			},
			requester_field: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			field_configs: {
				type: Sequelize.JSON,
			},
			operator: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			requester_roles: {
				type: Sequelize.ARRAY(Sequelize.STRING),
				defaultValue: ['ALL'],
			},
			requester_roles_config: {
				type: Sequelize.JSON,
				defaultValue: { exclude: false },
			},
			organization_id: {
				type: Sequelize.STRING,
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

		// Add a unique constraint to prevent duplicate rules (with partial index)
		await queryInterface.sequelize.query(`
			CREATE UNIQUE INDEX unique_default_rules_constraint 
			ON default_rules (type, target_field, requester_field, organization_id) 
			WHERE deleted_at IS NULL;
		`)
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeConstraint('default_rules', 'unique_default_rules_constraint')

		await queryInterface.removeIndex('default_rules', ['type'])
		await queryInterface.removeIndex('default_rules', ['organization_id'])
		await queryInterface.removeIndex('default_rules', ['type', 'organization_id'])

		await queryInterface.dropTable('default_rules')
	},
}
