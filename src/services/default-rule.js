// Dependencies
const httpStatusCode = require('@generics/http-status')
const defaultRuleQueries = require('@database/queries/defaultRule')
const { UniqueConstraintError } = require('sequelize')
const { Op } = require('sequelize')
const responses = require('@helpers/responses')

module.exports = class DefaultRuleHelper {
	/**
	 * Create default rule.
	 * @method
	 * @name create
	 * @param {Object} bodyData - Default rule body data.
	 * @param {String} userId - User ID creating the rule.
	 * @param {String} orgId - Org Id of the user.
	 * @returns {JSON} - Created default rule response.
	 */
	static async create(bodyData, userId, orgId) {
		bodyData.created_by = userId
		bodyData.updated_by = userId
		bodyData.organization_id = orgId

		try {
			const defaultRule = await defaultRuleQueries.create(bodyData)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'DEFAULT_RULE_CREATED_SUCCESSFULLY',
				result: defaultRule,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error
		}
	}

	/**
	 * Update default rule.
	 * @method
	 * @name update
	 * @param {Object} bodyData - Body data to update.
	 * @param {String} ruleId - Default rule ID.
	 * @param {String} userId - User ID updating the rule.
	 * @returns {JSON} - Updated default rule response.
	 */
	static async update(bodyData, ruleId, userId) {
		bodyData.updated_by = userId
		try {
			const [updateCount, updatedDefaultRule] = await defaultRuleQueries.updateOne(ruleId, bodyData, {
				returning: true,
				raw: true,
			})

			if (updateCount === 0) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'DEFAULT_RULE_UPDATED_SUCCESSFULLY',
				result: updatedDefaultRule,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error
		}
	}

	/**
	 * Read all default rules.
	 * @method
	 * @name readAll
	 * @param {Object} filter - Filter to find default rules.
	 * @returns {JSON} - Found default rules response.
	 */
	static async readAll(filter) {
		try {
			const defaultRules = await defaultRuleQueries.findAll(filter)
			if (!defaultRules.length) {
				return responses.failureResponse({
					message: 'DEFAULT_RULES_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULES_FETCHED_SUCCESSFULLY',
				result: defaultRules,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Read a single default rule by ID.
	 * @method
	 * @name readOne
	 * @param {String} ruleId - Default rule ID.
	 * @returns {JSON} - Found default rule response.
	 */
	static async readOne(ruleId) {
		try {
			const defaultRule = await defaultRuleQueries.findOne({ id: ruleId })
			if (!defaultRule) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULE_FETCHED_SUCCESSFULLY',
				result: defaultRule,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Delete default rule.
	 * @method
	 * @name delete
	 * @param {String} ruleId - Default rule ID.
	 * @returns {JSON} - Default rule deleted response.
	 */
	static async delete(ruleId) {
		try {
			const deleteCount = await defaultRuleQueries.deleteOne({ id: ruleId })
			if (deleteCount === 0) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'DEFAULT_RULE_DELETED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Count default rules based on filter.
	 * @method
	 * @name count
	 * @param {Object} filter - Filter to count default rules.
	 * @returns {JSON} - Count of default rules.
	 */
	static async count(filter) {
		try {
			const ruleCount = await defaultRuleQueries.countRules(filter)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULES_COUNT_FETCHED_SUCCESSFULLY',
				result: ruleCount,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Read default rules within a date range.
	 * @method
	 * @name readInDateRange
	 * @param {Date} startDate - Start date of the range.
	 * @param {Date} endDate - End date of the range.
	 * @returns {JSON} - Found default rules within the date range.
	 */
	static async readInDateRange(startDate, endDate) {
		try {
			const defaultRules = await defaultRuleQueries.findRulesInDateRange(startDate, endDate)
			if (!defaultRules.length) {
				return responses.failureResponse({
					message: 'DEFAULT_RULES_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULES_FETCHED_SUCCESSFULLY',
				result: defaultRules,
			})
		} catch (error) {
			throw error
		}
	}
}
