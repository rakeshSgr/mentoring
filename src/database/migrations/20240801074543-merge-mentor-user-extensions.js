'use strict'
require('module-alias/register')
require('dotenv').config()
const materializedViewsService = require('@generics/materializedViews')

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_user_extensions;')
		await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS m_mentor_extensions;')
		const [result] = await queryInterface.sequelize.query(
			`SELECT EXISTS (
			   SELECT 1 
			   FROM pg_tables 
			   WHERE schemaname = 'public' 
				 AND tablename = 'mentor_extensions'
			 );`
		)

		// Extract the 'exists' value
		const tableExists = result[0].exists

		if (tableExists) {
			await queryInterface.sequelize.transaction(async (transaction) => {
				// Add the is_mentor flag to user_extensions
				await queryInterface.addColumn(
					'user_extensions',
					'is_mentor',
					{
						type: Sequelize.BOOLEAN,
						allowNull: false,
						defaultValue: false,
					},
					{ transaction }
				)

				// Copy data from mentor_extensions to user_extensions
				await queryInterface.sequelize.query(
					`
        INSERT INTO user_extensions (
          user_id, designation, area_of_expertise, education_qualification,
          rating, meta, stats, tags, configs, mentor_visibility, visible_to_organizations,
          external_session_visibility, external_mentor_visibility, custom_entity_text,
          experience, organization_id, external_mentee_visibility, mentee_visibility,
          name, email, phone, is_mentor,created_at,updated_at
        )
        SELECT
          user_id, designation, area_of_expertise, education_qualification,
          rating, meta, stats, tags, configs, mentor_visibility, visible_to_organizations,
          external_session_visibility, external_mentor_visibility, custom_entity_text,
          experience, organization_id, external_mentee_visibility, mentee_visibility,
          name, email, phone, true,created_at,updated_at
        FROM mentor_extensions
      `,
					{ transaction }
				)

				// Drop the mentor_extensions table
				await queryInterface.dropTable('mentor_extensions', { transaction })
			})
		}
		await materializedViewsService.checkAndCreateMaterializedViews()
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.sequelize.transaction(async (transaction) => {
			// Recreate the mentor_extensions table
			await queryInterface.createTable(
				'mentor_extensions',
				{
					user_id: {
						allowNull: false,
						primaryKey: true,
						type: Sequelize.INTEGER,
					},
					designation: {
						type: Sequelize.ARRAY(Sequelize.STRING),
					},
					area_of_expertise: {
						type: Sequelize.ARRAY(Sequelize.STRING),
					},
					education_qualification: {
						type: Sequelize.STRING,
					},
					rating: {
						type: Sequelize.JSON,
					},
					meta: {
						type: Sequelize.JSONB,
					},
					stats: {
						type: Sequelize.JSONB,
					},
					tags: {
						type: Sequelize.ARRAY(Sequelize.STRING),
					},
					configs: {
						type: Sequelize.JSON,
					},
					mentor_visibility: {
						type: Sequelize.STRING,
					},
					visible_to_organizations: {
						type: Sequelize.ARRAY(Sequelize.INTEGER),
					},
					external_session_visibility: {
						type: Sequelize.STRING,
					},
					external_mentor_visibility: {
						type: Sequelize.STRING,
					},
					custom_entity_text: {
						type: Sequelize.JSON,
					},
					experience: {
						type: Sequelize.STRING,
					},
					organization_id: {
						type: Sequelize.INTEGER,
						allowNull: false,
					},
					external_mentee_visibility: {
						type: Sequelize.STRING,
						defaultValue: 'CURRENT',
					},
					mentee_visibility: {
						type: Sequelize.STRING,
						defaultValue: 'CURRENT',
					},
					name: {
						type: Sequelize.STRING,
					},
					email: {
						type: Sequelize.STRING,
					},
					phone: {
						type: Sequelize.STRING,
					},
				},
				{ transaction }
			)

			// Move data back to mentor_extensions
			await queryInterface.sequelize.query(
				`
        INSERT INTO mentor_extensions (
          user_id, designation, area_of_expertise, education_qualification,
          rating, meta, stats, tags, configs, mentor_visibility, visible_to_organizations,
          external_session_visibility, external_mentor_visibility, custom_entity_text,
          experience, organization_id, external_mentee_visibility, mentee_visibility,
          name, email, phone
        )
        SELECT
          user_id, designation, area_of_expertise, education_qualification,
          rating, meta, stats, tags, configs, mentor_visibility, visible_to_organizations,
          external_session_visibility, external_mentor_visibility, custom_entity_text,
          experience, organization_id, external_mentee_visibility, mentee_visibility,
          name, email, phone
        FROM user_extensions
        WHERE is_mentor = true
      `,
				{ transaction }
			)

			// Remove the is_mentor flag from user_extensions
			await queryInterface.removeColumn('user_extensions', 'is_mentor', { transaction })
		})
		await materializedViewsService.checkAndCreateMaterializedViews()
	},
}
