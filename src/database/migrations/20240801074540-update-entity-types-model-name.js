'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const [entityTypes] = await queryInterface.sequelize.query(
			`SELECT id, model_names FROM entity_types WHERE model_names IS NOT NULL;`
		)

		for (const entityType of entityTypes) {
			let updatedModelNames = entityType.model_names

			// Remove 'MentorExtension' if it exists
			updatedModelNames = updatedModelNames.filter((name) => name !== 'MentorExtension')

			// If 'MentorExtension' was the only entry, replace with 'UserExtension'
			if (updatedModelNames.length === 0) {
				updatedModelNames = ['UserExtension']
			}

			await queryInterface.bulkUpdate('entity_types', { model_names: updatedModelNames }, { id: entityType.id })
		}
	},

	down: async (queryInterface, Sequelize) => {
		const [entityTypes] = await queryInterface.sequelize.query(
			`SELECT id, model_names FROM entity_types WHERE model_names IS NOT NULL;`
		)

		for (const entityType of entityTypes) {
			let updatedModelNames = entityType.model_names

			// If 'UserExtension' is present, add 'MentorExtension' back
			if (updatedModelNames.includes('UserExtension') && !updatedModelNames.includes('MentorExtension')) {
				updatedModelNames.push('MentorExtension')
			}

			await queryInterface.bulkUpdate('entity_types', { model_names: updatedModelNames }, { id: entityType.id })
		}
	},
}
