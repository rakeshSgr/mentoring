'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Change created_by and updated_by to STRING
		await queryInterface.changeColumn('availabilities', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('availabilities', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('default_rules', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('default_rules', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('entities', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('entities', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('entity_types', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('entity_types', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('file_uploads', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('file_uploads', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('notification_templates', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('notification_templates', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('organization_extension', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('organization_extension', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('question_sets', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('question_sets', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('questions', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('questions', 'updated_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('role_permission_mapping', 'created_by', {
			type: Sequelize.STRING,
		})

		await queryInterface.changeColumn('sessions', 'created_by', {
			type: Sequelize.STRING,
		})
		await queryInterface.changeColumn('sessions', 'updated_by', {
			type: Sequelize.STRING,
		})
	},

	down: async (queryInterface, Sequelize) => {
		// Revert changes back to INTEGER
		await queryInterface.changeColumn('availabilities', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('availabilities', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('default_rules', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('default_rules', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('entities', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('entities', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('entity_types', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('entity_types', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('file_uploads', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('file_uploads', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('notification_templates', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('notification_templates', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('organization_extension', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('organization_extension', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('question_sets', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('question_sets', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('questions', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('questions', 'updated_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('role_permission_mapping', 'created_by', {
			type: Sequelize.INTEGER,
		})

		await queryInterface.changeColumn('sessions', 'created_by', {
			type: Sequelize.INTEGER,
		})
		await queryInterface.changeColumn('sessions', 'updated_by', {
			type: Sequelize.INTEGER,
		})
	},
}
