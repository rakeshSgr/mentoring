'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Change organization_id to STRING
		await queryInterface.changeColumn('availabilities', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('default_rules', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('entity_types', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('file_uploads', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('forms', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('mentor_extensions', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('notification_templates', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('organization_extension', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		await queryInterface.changeColumn('user_extensions', 'organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})

		// Change mentor_organization_id in sessions
		await queryInterface.changeColumn('sessions', 'mentor_organization_id', {
			type: Sequelize.STRING,
			allowNull: false,
		})
	},

	down: async (queryInterface, Sequelize) => {
		// Revert changes back to INTEGER
		await queryInterface.changeColumn('availabilities', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('default_rules', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('entity_types', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('file_uploads', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('forms', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('mentor_extensions', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('notification_templates', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('organization_extension', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		await queryInterface.changeColumn('user_extensions', 'organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})

		// Revert mentor_organization_id in sessions to INTEGER
		await queryInterface.changeColumn('sessions', 'mentor_organization_id', {
			type: Sequelize.INTEGER,
			allowNull: false,
		})
	},
}
