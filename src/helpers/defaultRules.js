'use strict'
const defaultRuleQueries = require('@database/queries/defaultRule')
const mentorQueries = require('@database/queries/mentorExtension')
const menteeQueries = require('@database/queries/userExtension')
const { Op } = require('sequelize')

const { isAMentor } = require('@generics/utils')

class MissingFieldError extends Error {
	constructor(field) {
		super(`Value for field ${field} is undefined or null`)
		this.name = 'MissingFieldError'
		this.field = field
	}
}

/**
 * Gets the valid configurations based on user roles.
 *
 * @param {Array<Object>} config - The configuration array.
 * @param {Array<Object>} userRoles - The user roles array.
 * @returns {Array<Object>} - The array of valid configurations.
 */
function getValidConfigs(config, userRoles) {
	const userRoleTitles = userRoles.map((role) => role.title)
	const validConfigs = []

	for (let conf of config) {
		const { requester_roles, role_config } = conf
		const { exclude } = role_config

		if (exclude) {
			// Exclude logic: valid if none of the user roles are in the requester_roles
			const hasExclusion = requester_roles.some((role) => userRoleTitles.includes(role))
			if (!hasExclusion) {
				validConfigs.push(conf)
			}
		} else {
			// Include logic: valid if any of the user roles are in the requester_roles
			const hasInclusion = requester_roles.some((role) => userRoleTitles.includes(role))
			if (hasInclusion) {
				validConfigs.push(conf)
			}
		}
	}

	return validConfigs
}
/**
 * Gets the user details based on user roles.
 *
 * @param {string} userId - The ID of the user.
 * @param {Array<string>} userRoles - The roles of the user.
 * @returns {Promise<Object>} - A promise that resolves to the user details.
 * @throws {Error} - Throws an error if the user details cannot be retrieved.
 */
async function getUserDetails(userId, userRoles) {
	try {
		if (isAMentor(userRoles)) {
			return await mentorQueries.findOneFromView(userId)
		} else {
			return await menteeQueries.findOneFromView(userId)
		}
	} catch (error) {
		console.log(error)
		throw new Error(`Failed to get user details: ${error.message}`)
	}
}

exports.defaultRulesFilter = async function defaultRulesFilter({
	ruleType,
	requesterId,
	roles,
	requesterOrganizationId,
}) {
	try {
		const [userDetails, defaultRules] = await Promise.all([
			getUserDetails(requesterId, roles),
			defaultRuleQueries.findAll({ type: ruleType, organization_id: requesterOrganizationId }),
		])

		console.log(userDetails)

		const validConfigs = getValidConfigs(defaultRules, roles)
		console.log(validConfigs)

		if (validConfigs.length === 0) {
			return ''
		}

		const whereClauses = []
		const mentorWhereClause = []

		validConfigs.forEach((config) => {
			const { is_target_from_sessions_mentor, target_field, matching_operator, requester_field } = config
			const requesterValue = userDetails[requester_field]

			if (requesterValue === undefined || requesterValue === null) {
				throw new MissingFieldError(requester_field)
			}

			if (is_target_from_sessions_mentor) {
				mentorWhereClause.push(`${target_field} ${matching_operator} '${requesterValue}'`)
			} else {
				if (Array.isArray(requesterValue)) {
					const formattedValues = requesterValue.map((value) =>
						typeof value === 'string' ? `'${value}'` : value
					)
					whereClauses.push(
						`(${target_field} ${matching_operator} ARRAY[${formattedValues.join(
							', '
						)}]::character varying[])`
					)
				} else {
					whereClauses.push(`${target_field} ${matching_operator} '${requesterValue}'`)
				}
			}
		})

		if (mentorWhereClause.length > 0) {
			const filterClause = mentorWhereClause.join(' AND ')
			const mentors = await mentorQueries.getMentorsFromView(filterClause, 'user_id')
			const mentorIds = mentors.data.map(({ user_id }) => user_id)

			if (mentorIds.length > 0) {
				whereClauses.push(`mentor_id IN (${mentorIds.join(',')})`)
			} else {
				// No mentors found, return null
				return null
			}
		}

		return whereClauses.join(' AND ')
	} catch (error) {
		console.error('Error:', error.message)
		throw error // Re-throw the error after logging it
	}
}
