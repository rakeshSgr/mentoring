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
	static async update(bodyData, ruleId, userId, orgId) {
		bodyData.updated_by = userId
		try {
			const [updateCount, updatedDefaultRule] = await defaultRuleQueries.updateOne(
				{ id: ruleId, organization_id: orgId },
				bodyData,
				{
					returning: true,
					raw: true,
				}
			)

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
	static async readAll(orgId) {
		try {
			const defaultRules = await defaultRuleQueries.findAndCountAll({ organization_id: orgId })

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULES_FETCHED_SUCCESSFULLY',
				result: {
					data: defaultRules.rows,
					count: defaultRules.count,
				},
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
	static async readOne(ruleId, orgId) {
		try {
			const defaultRule = await defaultRuleQueries.findOne({ id: ruleId, organization_id: orgId })
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
}
