'use strict'
require('module-alias/register')
const userRequests = require('@requests/user')
const emailEncryption = require('../../utils/emailEncryption')

module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const { STRING } = Sequelize

			await queryInterface.addColumn('mentor_extensions', 'name', { type: STRING, allowNull: true })
			await queryInterface.addColumn('mentor_extensions', 'email', { type: STRING, allowNull: true })
			await queryInterface.addColumn('mentor_extensions', 'phone', { type: STRING, allowNull: true })
			await queryInterface.addColumn('user_extensions', 'name', { type: STRING, allowNull: true })
			await queryInterface.addColumn('user_extensions', 'email', { type: STRING, allowNull: true })
			await queryInterface.addColumn('user_extensions', 'phone', { type: STRING, allowNull: true })

			//Update existing users name and email
			const [[mentorCountResult], [menteeCountResult]] = await Promise.all([
				queryInterface.sequelize.query(
					'SELECT count(*) AS "count" FROM mentor_extensions WHERE (name IS NULL OR email IS NULL) AND deleted_at IS NOT NULL;'
				),
				queryInterface.sequelize.query(
					'SELECT count(*) AS "count" FROM user_extensions WHERE (name IS NULL OR email IS NULL) AND deleted_at IS NOT NULL;'
				),
			])

			const mentorCount = mentorCountResult[0].count
			const menteeCount = menteeCountResult[0].count

			console.log(`Number of mentors to update: ${mentorCount}`)
			console.log(`Number of mentees to update: ${menteeCount}`)

			const updateUsers = async (table, userIds, batchSize = 5000) => {
				const updateBatch = async (batch) => {
					const userDetails = (await userRequests.getListOfUserDetails(batch)).result
					const userDetailsMap = Object.fromEntries(userDetails.map((user) => [user.id, user]))

					const updates = batch.map(async (userId) => {
						const matchingUser = userDetailsMap[userId]
						if (matchingUser) {
							try {
								await queryInterface.sequelize.query(
									`UPDATE ${table} SET name = ?, email = ? WHERE user_id = ?`,
									{
										replacements: [
											matchingUser.name,
											emailEncryption.encrypt(matchingUser.email),
											userId,
										],
									}
								)
							} catch (error) {
								console.error(`Error updating userId ${userId} in ${table}:`, error)
							}
						} else {
							console.warn(`No matching user found for userId: ${userId} in ${table}`)
						}
					})

					await Promise.all(updates)
				}

				for (let i = 0; i < userIds.length; i += batchSize) {
					const batch = userIds.slice(i, i + batchSize)
					await updateBatch(batch)
				}
			}

			if (mentorCount > 0) {
				const [mentors] = await queryInterface.sequelize.query(
					'SELECT user_id FROM mentor_extensions WHERE (name IS NULL OR email IS NULL) AND deleted_at IS NOT NULL;'
				)
				const mentorIds = mentors.map((item) => item.user_id)
				await updateUsers('mentor_extensions', mentorIds)
			}

			if (menteeCount > 0) {
				const [mentees] = await queryInterface.sequelize.query(
					'SELECT user_id FROM user_extensions WHERE (name IS NULL OR email IS NULL) AND deleted_at IS NOT NULL;'
				)
				const menteeIds = mentees.map((item) => item.user_id)
				await updateUsers('user_extensions', menteeIds)
			}
		} catch (error) {
			console.log(error)
			throw error
		}
	},

	down: async (queryInterface) => {
		try {
			await queryInterface.removeColumn('mentor_extensions', 'name')
			await queryInterface.removeColumn('mentor_extensions', 'email')
			await queryInterface.removeColumn('mentor_extensions', 'phone')
			await queryInterface.removeColumn('user_extensions', 'name')
			await queryInterface.removeColumn('user_extensions', 'email')
			await queryInterface.removeColumn('user_extensions', 'phone')
		} catch (err) {
			console.log(err)
			throw err
		}
	},
}
