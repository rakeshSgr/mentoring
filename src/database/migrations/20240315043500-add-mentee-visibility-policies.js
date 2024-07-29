'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn('organization_extension', 'mentee_visibility_policy', {
			type: Sequelize.STRING,
			defaultValue: 'CURRENT',
		})

		await queryInterface.addColumn('organization_extension', 'external_mentee_visibility_policy', {
			type: Sequelize.STRING,
			defaultValue: 'CURRENT',
		})

		await queryInterface.addColumn('user_extensions', 'external_mentee_visibility', {
			type: Sequelize.STRING,
			defaultValue: 'CURRENT',
		})
		await queryInterface.addColumn('user_extensions', 'mentee_visibility', {
			type: Sequelize.STRING,
			defaultValue: 'CURRENT',
		})

		await queryInterface.renameColumn('user_extensions', 'visibility', 'mentor_visibility')

		await queryInterface.addColumn('mentor_extensions', 'external_mentee_visibility', {
			type: Sequelize.STRING,
			defaultValue: 'CURRENT',
		})

		await queryInterface.addColumn('mentor_extensions', 'mentee_visibility', {
			type: Sequelize.STRING,
			defaultValue: 'CURRENT',
		})

		await queryInterface.renameColumn('mentor_extensions', 'visibility', 'mentor_visibility')
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn('organization_extension', 'mentee_visibility_policy')
		await queryInterface.removeColumn('organization_extension', 'external_mentee_visibility_policy')
		await queryInterface.removeColumn('user_extensions', 'external_mentee_visibility')
		await queryInterface.removeColumn('user_extensions', 'mentee_visibility')
		await queryInterface.renameColumn('user_extensions', 'mentor_visibility', 'visibility')
		await queryInterface.removeColumn('mentor_extensions', 'external_mentee_visibility')
		await queryInterface.removeColumn('mentor_extensions', 'mentee_visibility')
		await queryInterface.renameColumn('mentor_extensions', 'mentor_visibility', 'visibility')
	},
}
