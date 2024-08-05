'use strict'
require('module-alias/register')
require('dotenv').config()
const materializedViewsService = require('@generics/materializedViews')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const [citusEnabled] = await queryInterface.sequelize.query(
			"SELECT COUNT(*) FROM pg_extension WHERE extname = 'citus';"
		)
		if (citusEnabled[0].count > 0) {
			const tables = [
				'entities',
				'entity_types',
				'feedbacks',
				'forms',
				'issues',
				'mentor_extensions',
				'notification_templates',
				'organization_extension',
				'questions',
				'question_sets',
				'session_attendees',
				'session_enrollments',
				'session_ownerships',
				'user_extensions',
				'sessions',
			]

			for (const table of tables) {
				const [isDistributed] = await queryInterface.sequelize.query(
					`SELECT COUNT(*) FROM pg_dist_partition WHERE logicalrelid = '${table}'::regclass;`
				)
				if (isDistributed[0].count > 0) {
					await queryInterface.sequelize.query(`SELECT undistribute_table('${table}');`)
				}
			}

			await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_sessions;')
			await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_user_extensions;')
			await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_mentor_extensions;')
		}
	},

	async down(queryInterface, Sequelize) {
		const [citusEnabled] = await queryInterface.sequelize.query(
			"SELECT COUNT(*) FROM pg_extension WHERE extname = 'citus';"
		)
		if (citusEnabled[0].count > 0) {
			await queryInterface.sequelize.query("SELECT create_distributed_table('entities', 'entity_type_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('entity_types', 'organization_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('feedbacks', 'user_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('forms', 'organization_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('issues', 'id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('mentor_extensions', 'user_id');")
			await queryInterface.sequelize.query(
				"SELECT create_distributed_table('notification_templates', 'organization_id');"
			)
			await queryInterface.sequelize.query(
				"SELECT create_distributed_table('organization_extension', 'organization_id');"
			)
			await queryInterface.sequelize.query("SELECT create_distributed_table('questions', 'id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('question_sets', 'code');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('session_attendees', 'session_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('session_enrollments', 'mentee_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('session_ownerships', 'mentor_id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('sessions', 'id');")
			await queryInterface.sequelize.query("SELECT create_distributed_table('user_extensions', 'user_id');")

			await materializedViewsService.checkAndCreateMaterializedViews()
		}
	},
}
