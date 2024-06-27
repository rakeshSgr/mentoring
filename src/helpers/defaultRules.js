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

	function hasMatchingRole(requesterRoles) {
		return requesterRoles.some((role) => userRoleTitles.includes(role))
	}

	for (let conf of config) {
		const { requester_roles, role_config } = conf
		const { exclude } = role_config

		//check exclusion or inclusion based on the flag
		const isValid = exclude ? !hasMatchingRole(requester_roles) : hasMatchingRole(requester_roles)

		if (isValid) {
			validConfigs.push(conf)
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
async function getUserDetailsFromView(userId, isAMentor) {
	try {
		if (isAMentor) {
			return await mentorQueries.findOneFromView(userId)
		} else {
			return await menteeQueries.findOneFromView(userId)
		}
	} catch (error) {
		console.log(error)
		throw new Error(`Failed to get user details: ${error.message}`)
	}
}
/**
 * Gets the user details based on user roles.
 *
 * @param {string} userId - The ID of the user.
 * @param {Array<string>} userRoles - The roles of the user.
 * @returns {Promise<Object>} - A promise that resolves to the user details.
 * @throws {Error} - Throws an error if the user details cannot be retrieved.
 */
async function getUserDetails(userId, isAMentor) {
	try {
		if (isAMentor) {
			return await mentorQueries.getMentorExtension(userId)
		} else {
			return await menteeQueries.getMenteeExtension(userId)
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
			getUserDetailsFromView(requesterId, isAMentor(roles)),
			defaultRuleQueries.findAll({ type: ruleType, organization_id: requesterOrganizationId }),
		])

		const validConfigs = getValidConfigs(defaultRules, roles)

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

exports.validateDefaultRulesFilter = async function validateDefaultRulesFilter({
	ruleType,
	requesterId,
	roles,
	requesterOrganizationId,
	data,
}) {
	try {
		const [userDetails, defaultRules] = await Promise.all([
			getUserDetails(requesterId, isAMentor(roles)),
			defaultRuleQueries.findAll({ type: ruleType, organization_id: requesterOrganizationId }),
		])

		const validConfigs = getValidConfigs(defaultRules, roles)

		if (validConfigs.length === 0) {
			return true // No rules to check, data is valid by default
		}

		const mentorChecks = []

		for (const config of validConfigs) {
			const { is_target_from_sessions_mentor, target_field, matching_operator, requester_field } = config
			const requesterValue =
				userDetails[requester_field] || (userDetails.meta && userDetails.meta[requester_field])

			if (requesterValue === undefined || requesterValue === null) {
				throw new MissingFieldError(requester_field)
			}

			if (is_target_from_sessions_mentor) {
				mentorChecks.push({ target_field, matching_operator, requesterValue })
			} else {
				const targetFieldValue = data[target_field] || (data.meta && data.meta[requester_field])

				if (targetFieldValue === undefined || targetFieldValue === null) {
					return false
				}
				if (!evaluateCondition(targetFieldValue, matching_operator, requesterValue)) {
					return false // Data does not meet the condition
				}
			}
		}

		if (mentorChecks.length > 0 && data.mentor_id) {
			const mentorDetails = await getUserDetails(data.mentor_id, true)

			for (const { target_field, matching_operator, requesterValue } of mentorChecks) {
				const targetFieldValue = mentorDetails[target_field] || mentorDetails.meta[target_field]
				if (targetFieldValue === undefined || targetFieldValue === null) {
					return false
				}
				if (!evaluateCondition(targetFieldValue, matching_operator, requesterValue)) {
					return false // Mentor details do not meet the condition
				}
			}
		}

		return true // Data meets all conditions
	} catch (error) {
		console.error('Error:', error.message)
		throw error // Re-throw the error after logging it
	}
}

function evaluateCondition(targetValue, operator, requesterValue) {
	if (Array.isArray(requesterValue)) {
		switch (operator) {
			case '@>':
				// Check if targetValue contains all elements of requesterValue
				return requesterValue.every((value) => targetValue.includes(value))
			case '&&':
				// Check if targetValue and requesterValue have any elements in common
				return requesterValue.some((value) => targetValue.includes(value))
			case '<@':
				// Check if requesterValue is contained by targetValue
				return targetValue.every((value) => requesterValue.includes(value))
			default:
				throw new Error(`Unsupported array operator: ${operator}`)
		}
	} else {
		switch (operator) {
			case '=':
				return targetValue === requesterValue
			case '!=':
				return targetValue !== requesterValue
			case '<':
				return targetValue < requesterValue
			case '>':
				return targetValue > requesterValue
			case '<=':
				return targetValue <= requesterValue
			case '>=':
				return targetValue >= requesterValue
			default:
				throw new Error(`Unsupported operator: ${operator}`)
		}
	}
}
