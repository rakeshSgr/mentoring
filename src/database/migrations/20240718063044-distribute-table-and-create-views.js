'use strict'
require('module-alias/register')
require('dotenv').config()
const materializedViewsService = require('@generics/materializedViews')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.sequelize.query("SELECT create_distributed_table('entity_types', 'organization_id');")
		await queryInterface.sequelize.query("SELECT create_distributed_table('feedbacks', 'user_id');")
		await queryInterface.sequelize.query("SELECT create_distributed_table('forms', 'organization_id');")
		await queryInterface.sequelize.query("SELECT create_distributed_table('mentor_extensions', 'user_id');")
		await queryInterface.sequelize.query(
			"SELECT create_distributed_table('notification_templates', 'organization_id');"
		)
		await queryInterface.sequelize.query(
			"SELECT create_distributed_table('organization_extension', 'organization_id');"
		)
		await queryInterface.sequelize.query("SELECT create_distributed_table('session_enrollments', 'mentee_id');")
		await queryInterface.sequelize.query("SELECT create_distributed_table('session_ownerships', 'user_id');")
		await queryInterface.sequelize.query("SELECT create_distributed_table('user_extensions', 'user_id');")

		await materializedViewsService.checkAndCreateMaterializedViews()
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.query("SELECT undistribute_table('entity_types');")
		await queryInterface.sequelize.query("SELECT undistribute_table('feedbacks');")
		await queryInterface.sequelize.query("SELECT undistribute_table('forms');")
		await queryInterface.sequelize.query("SELECT undistribute_table('mentor_extensions');")
		await queryInterface.sequelize.query("SELECT undistribute_table('notification_templates');")
		await queryInterface.sequelize.query("SELECT undistribute_table('organization_extension');")
		await queryInterface.sequelize.query("SELECT undistribute_table('session_enrollments');")
		await queryInterface.sequelize.query("SELECT undistribute_table('session_ownerships');")
		await queryInterface.sequelize.query("SELECT undistribute_table('user_extensions');")

		await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_sessions;')
		await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_user_extensions;')
		await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_mentor_extensions;')
	},
}
