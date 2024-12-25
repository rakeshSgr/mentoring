const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')
const common = require('@constants/common')
const menteeQueries = require('@database/queries/userExtension')
const sessionQueries = require('@database/queries/sessions')
const mentorQueries = require('@database/queries/mentorExtension')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const utils = require('@generics/utils')
const getOrgIdAndEntityTypes = require('@helpers/getOrgIdAndEntityTypewithEntitiesBasedOnPolicy')
const reportMappingQueries = require('@database/queries/reportRoleMapping')
const reportQueryQueries = require('@database/queries/reportQueries')
const reportsQueries = require('@database/queries/reports')
const reportTypeQueries = require('@database/queries/reportTypes')
const { sequelize } = require('@database/models')
const { isNull } = require('lodash')

module.exports = class ReportsHelper {
	/**
	 * Get entityTypes for reports
	 * @method
	 * @name getReportFilterList
	 * @param {String} tokenInformation - token information
	 * @param {Boolean} queryParams - queryParams
	 * @returns {JSON} - Report filter list.
	 */
	static async getFilterList(entity_type, filterType, tokenInformation, reportFilter) {
		try {
			let result = {
				entity_types: {},
			}

			const filter_type = filterType !== '' ? filterType : common.MENTOR_ROLE
			const report_filter = reportFilter === '' ? {} : { report_filter: reportFilter }

			let organization_ids = []
			const organizations = await getOrgIdAndEntityTypes.getOrganizationIdBasedOnPolicy(
				tokenInformation.id,
				tokenInformation.organization_id,
				filter_type
			)

			if (organizations.success && organizations.result.length > 0) {
				organization_ids = [...organizations.result]

				if (organization_ids.length > 0) {
					const defaultOrgId = await getDefaultOrgId()
					const modelName = []
					const queryMap = {
						[common.MENTEE_ROLE]: menteeQueries.getModelName,
						[common.MENTOR_ROLE]: mentorQueries.getModelName,
						[common.SESSION]: sessionQueries.getModelName,
					}
					if (queryMap[filter_type.toLowerCase()]) {
						const modelNameResult = await queryMap[filter_type.toLowerCase()]()
						modelName.push(modelNameResult)
					}
					// get entity type with entities list
					const getEntityTypesWithEntities = await getOrgIdAndEntityTypes.getEntityTypeWithEntitiesBasedOnOrg(
						organization_ids,
						entity_type,
						defaultOrgId ? defaultOrgId : '',
						modelName,
						report_filter
					)

					if (getEntityTypesWithEntities.success && getEntityTypesWithEntities.result) {
						let entityTypesWithEntities = getEntityTypesWithEntities.result
						if (entityTypesWithEntities.length > 0) {
							let convertedData = utils.convertEntitiesForFilter(entityTypesWithEntities)
							let doNotRemoveDefaultOrg = false
							if (organization_ids.includes(defaultOrgId)) {
								doNotRemoveDefaultOrg = true
							}
							result.entity_types = utils.filterEntitiesBasedOnParent(
								convertedData,
								defaultOrgId,
								doNotRemoveDefaultOrg
							)
						}
					}
				}
			}

			// search for type entityType and add 'ALL' to entities list of type
			// added roles inside the result
			if (result.entity_types.type) {
				result.entity_types.type.forEach((typeObj) => {
					if (typeObj.entities) {
						typeObj.entities.push({
							entity_type_id: typeObj.id,
							value: common.ALL,
							label: common.All,
							status: common.ACTIVE_STATUS,
							type: common.SYSTEM,
						})
					}
				})
			}
			result.roles = tokenInformation.roles
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'REPORT_FILTER_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get report data for reports
	 * @method
	 * @name getReportData
	 * @param {String} tokenInformation - token information
	 * @param {Boolean} queryParams - queryParams
	 * @returns {JSON} - Report Data list.
	 */
	static async getReportData(
		userId,
		reportCode,
		reportRole,
		startDate,
		endDate,
		sessionType,
		entityType,
		sortColumn,
		sortType
	) {
		try {
			let reportDataResult = {}

			// Check if the user has permission to access the report
			const checkReportPermission = await reportMappingQueries.findReportRoleMappingByReportCode(reportCode)
			if (!checkReportPermission || checkReportPermission.dataValues.role_title !== reportRole) {
				return responses.failureResponse({
					message: 'REPORT_CODE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Get the report configuration and type
			const getReportConfigAndType = await reportsQueries.findReportByCode(reportCode)
			const getReportTypeTitle = await reportTypeQueries.findReportTypeById(
				getReportConfigAndType.dataValues.report_type_id
			)
			reportDataResult.report_type = getReportTypeTitle.dataValues.title
			reportDataResult.config = getReportConfigAndType.dataValues.config

			// Fetch the dynamic query based on report code
			const getReportQuery = await reportQueryQueries.findReportQueryByCode(reportCode)

			let query = getReportQuery.query
			//	let updatedsortType = sortType.replace(/''/g, "")

			query = query.replace(/\${sort_type}/g, sortType ? sortType.toUpperCase() : 'ASC')
			// Replace dynamic placeholders in the query with actual values only if the corresponding variable exists
			const result = await sequelize.query(query, {
				replacements: {
					userId: userId != '' ? userId : null,
					start_date: startDate != '' ? startDate : null,
					end_date: endDate != '' ? endDate : null,
					entity_type: entityType ? `{${entityType}}` : null,
					session_type: sessionType != '' ? utils.convertToTitleCase(sessionType) : null,
					sort_column: sortColumn != '' ? sortColumn : null,
					sort_type: sortType != '' ? sortType : null,
				},
				type: sequelize.QueryTypes.SELECT,
			})

			// Flatten the result data and add to the reportDataResult object
			if (result && result.length > 0) {
				// Assuming the result contains an array with one object, we can flatten it
				const flattenedResult = { ...result }

				// Adding other fields to the flattened object
				reportDataResult = {
					...reportDataResult,
					reportData: flattenedResult,
				}
			}

			// Return the response with the modified reportDataResult
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'REPORT_DATA_SUCCESSFULLY_FETCHED',
				result: reportDataResult,
			})
		} catch (error) {
			return error
		}
	}
}
