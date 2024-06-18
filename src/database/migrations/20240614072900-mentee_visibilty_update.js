'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const transaction = await queryInterface.sequelize.transaction()
		try {
			// Fetch data from the organization_extension table
			const organizations = await queryInterface.sequelize.query(
				`SELECT organization_id, session_visibility_policy, external_session_visibility_policy, mentee_visibility_policy, external_mentee_visibility_policy FROM organization_extension;`,
				{ type: Sequelize.QueryTypes.SELECT, transaction }
			)

			// Update mentee_visibility_policy and external_mentee_visibility_policy based on session_visibility_policy and external_session_visibility_policy
			const updateOrganizationExtensionPromises = organizations.map((org) => {
				return queryInterface.sequelize.query(
					`UPDATE organization_extension
           SET mentee_visibility_policy = :session_visibility_policy,
               external_mentee_visibility_policy = :external_session_visibility_policy
           WHERE organization_id = :organization_id;`,
					{
						replacements: {
							session_visibility_policy: org.session_visibility_policy,
							external_session_visibility_policy: org.external_session_visibility_policy,
							organization_id: org.organization_id,
						},
						transaction,
					}
				)
			})

			// Update mentor_extensions table
			const updateMentorExtensionsPromises = organizations.map((org) => {
				return queryInterface.sequelize.query(
					`UPDATE mentor_extensions
           SET mentee_visibility = :session_visibility_policy,
               external_mentee_visibility = :external_session_visibility_policy
           WHERE organization_id = :organization_id;`,
					{
						replacements: {
							session_visibility_policy: org.session_visibility_policy,
							external_session_visibility_policy: org.external_session_visibility_policy,
							organization_id: org.organization_id,
						},
						transaction,
					}
				)
			})

			// Update user_extensions table
			const updateUserExtensionsPromises = organizations.map((org) => {
				return queryInterface.sequelize.query(
					`UPDATE user_extensions
           SET mentee_visibility = :session_visibility_policy,
               external_mentee_visibility = :external_session_visibility_policy
           WHERE organization_id = :organization_id;`,
					{
						replacements: {
							session_visibility_policy: org.session_visibility_policy,
							external_session_visibility_policy: org.external_session_visibility_policy,
							organization_id: org.organization_id,
						},
						transaction,
					}
				)
			})

			// Execute all update promises
			await Promise.all([
				...updateOrganizationExtensionPromises,
				...updateMentorExtensionsPromises,
				...updateUserExtensionsPromises,
			])
			await transaction.commit()
			console.log('Visibility values updated successfully.')
		} catch (error) {
			await transaction.rollback()
			console.error('Error updating visibility values:', error)
			throw error // Rethrow error to ensure migration fails
		}
	},

	async down(queryInterface, Sequelize) {
		const transaction = await queryInterface.sequelize.transaction()
		try {
			// Fetch data from the organization_extension table
			const organizations = await queryInterface.sequelize.query(
				`SELECT organization_id, mentee_visibility_policy, external_mentee_visibility_policy FROM organization_extension;`,
				{ type: Sequelize.QueryTypes.SELECT, transaction }
			)

			// Revert mentee_visibility_policy and external_mentee_visibility_policy back to their original states
			const revertOrganizationExtensionPromises = organizations.map((org) => {
				return queryInterface.sequelize.query(
					`UPDATE organization_extension
           SET session_visibility_policy = :mentee_visibility_policy,
               external_session_visibility_policy = :external_mentee_visibility_policy
           WHERE organization_id = :organization_id;`,
					{
						replacements: {
							mentee_visibility_policy: org.mentee_visibility_policy,
							external_mentee_visibility_policy: org.external_mentee_visibility_policy,
							organization_id: org.organization_id,
						},
						transaction,
					}
				)
			})

			// Revert changes in mentor_extensions table
			const revertMentorExtensionsPromises = organizations.map((org) => {
				return queryInterface.sequelize.query(
					`UPDATE mentor_extensions
           SET session_visibility_policy = :mentee_visibility,
               external_session_visibility_policy = :external_mentee_visibility
           WHERE organization_id = :organization_id;`,
					{
						replacements: {
							mentee_visibility_policy: org.mentee_visibility_policy,
							external_mentee_visibility_policy: org.external_mentee_visibility_policy,
							organization_id: org.organization_id,
						},
						transaction,
					}
				)
			})

			// Revert changes in user_extensions table
			const revertUserExtensionsPromises = organizations.map((org) => {
				return queryInterface.sequelize.query(
					`UPDATE user_extensions
           SET session_visibility_policy = :mentee_visibility,
               external_session_visibility_policy = :external_mentee_visibility
           WHERE organization_id = :organization_id;`,
					{
						replacements: {
							mentee_visibility_policy: org.mentee_visibility_policy,
							external_mentee_visibility_policy: org.external_mentee_visibility_policy,
							organization_id: org.organization_id,
						},
						transaction,
					}
				)
			})

			// Execute all revert promises
			await Promise.all([
				...revertOrganizationExtensionPromises,
				...revertMentorExtensionsPromises,
				...revertUserExtensionsPromises,
			])
			await transaction.commit()
			console.log('Reverted visibility values successfully.')
		} catch (error) {
			await transaction.rollback()
			console.error('Error reverting visibility values:', error)
			throw error
		}
	},
}
