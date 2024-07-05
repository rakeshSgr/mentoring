'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Update the 'required' column for specific existing data to true
		const valuesToUpdate = ['area_of_expertise', 'designation', 'recommended_for', 'categories', 'medium']

		await queryInterface.sequelize.transaction(async (transaction) => {
			await Promise.all(
				valuesToUpdate.map((value) =>
					queryInterface.bulkUpdate('entity_types', { required: true }, { value }, { transaction })
				)
			)
		})
	},

	async down(queryInterface, Sequelize) {
		// Rollback the 'required' column for the specific values to false
		const valuesToUpdate = ['area_of_expertise', 'designation', 'recommended_for', 'categories', 'medium']

		await queryInterface.sequelize.transaction(async (transaction) => {
			await Promise.all(
				valuesToUpdate.map((value) =>
					queryInterface.bulkUpdate('entity_types', { required: false }, { value }, { transaction })
				)
			)
		})
	},
}
