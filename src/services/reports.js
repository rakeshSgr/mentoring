const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')
const path = require('path')
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
const { sequelize } = require('@database/models')
const fs = require('fs')
const ProjectRootDir = path.join(__dirname, '../')
const inviteeFileDir = ProjectRootDir + common.tempFolderForBulkUpload
const fileUploadPath = require('@helpers/uploadFileToCloud')

module.exports = class ReportsHelper {
	/**
	 * Get Entity Types for Reports
	 * @method
	 * @name getFilterList
	 * @param {String} entity_type - Type of entity to filter (e.g., user, organization, session).
	 * @param {String} filterType - Type of filter to apply (e.g., date, role, status).
	 * @param {Object} tokenInformation - Decoded token containing user and organization details.
	 * @param {String} reportFilter - Specific report filter criteria.
	 * @returns {Object} - JSON object containing the report filter list.
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
	 * @param {String} userId - ID of the user requesting the report.
	 * @param {String} orgId - ID of the organization.
	 * @param {Number} page - Page number for pagination.
	 * @param {Number} limit - Number of items per page.
	 * @param {String} reportCode - Code identifying the report type.
	 * @param {String} reportRole - Role associated with the report access.
	 * @param {String} startDate - Start date for filtering the data (format: YYYY-MM-DD).
	 * @param {String} endDate - End date for filtering the data (format: YYYY-MM-DD).
	 * @param {String} sessionType - Type of session to filter (e.g., online, offline).
	 * @param {Array} entitiesValue - List of entity values for filtering.
	 * @param {String} sortColumn - Column name to sort the data.
	 * @param {String} sortType - Sorting order (asc/desc).
	 * @param {String} searchColumn - Column name to search within.
	 * @param {String} searchValue - Value to search for.
	 * @param {Boolean} downloadCsv - Flag to indicate if the data should be downloaded as a CSV file.
	 * @returns {Object} - JSON object containing the report data list.
	 */

	static async getReportData(
		userId,
		orgId,
		page,
		limit,
		reportCode,
		reportRole,
		startDate,
		endDate,
		sessionType,
		entitiesValue,
		sortColumn,
		sortType,
		searchColumn,
		searchValue,
		downloadCsv
	) {
		try {
			// Validate report permissions
			const reportPermission = await reportMappingQueries.findReportRoleMappingByReportCode(reportCode)
			if (!reportPermission || reportPermission.dataValues.role_title !== reportRole) {
				return responses.failureResponse({
					message: 'REPORT_CODE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Fetch report configuration
			const reportConfig = await reportsQueries.findReportByCode(reportCode)
			const reportQuery = await reportQueryQueries.findReportQueryByCode(reportCode)
			if (!reportConfig || !reportQuery) {
				return responses.failureResponse({
					message: 'REPORT_CONFIG_OR_QUERY_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const reportDataResult = {
				report_type: reportConfig.dataValues.report_type_title,
				config: reportConfig.dataValues.config,
			}

			// Prepare query replacements
			const defaultLimit = common.pagination.DEFAULT_LIMIT
			const replacements = {
				userId: userId || null,
				start_date: startDate || null,
				end_date: endDate || null,
				entities_value: entitiesValue ? `{${entitiesValue}}` : null,
				session_type: sessionType ? utils.convertToTitleCase(sessionType) : null,
				limit: limit || defaultLimit,
				offset: common.getPaginationOffset(page, limit),
				sort_column: sortColumn || '',
				sort_type: sortType.toUpperCase() || 'ASC',
				search_column: searchColumn || null,
				search_value: searchValue || null,
			}

			const noPaginationReplacements = {
				...replacements,
				limit: null,
				offset: null,
				search_column: null,
				search_value: null,
			}

			// Replace sort type placeholder in query
			let query = reportQuery.query.replace(/:sort_type/g, replacements.sort_type)

			// Execute query with pagination
			const [result, resultWithoutPagination] = await Promise.all([
				sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT }),
				sequelize.query(utils.removeLimitAndOffset(query), {
					replacements: noPaginationReplacements,
					type: sequelize.QueryTypes.SELECT,
				}),
			])

			// Process query results
			if (result?.length) {
				reportDataResult.data = reportDataResult.report_type === common.REPORT_TABLE ? result : { ...result[0] }
			} else {
				reportDataResult.data = common.report_session_message
			}

			// Handle CSV download
			if (resultWithoutPagination?.length && downloadCsv === 'true') {
				const outputFilePath = await this.generateAndUploadCSV(resultWithoutPagination, userId, orgId)
				reportDataResult.reportsDownloadUrl = await utils.getDownloadableUrl(outputFilePath)
				utils.clearFile(outputFilePath)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'REPORT_DATA_SUCCESSFULLY_FETCHED',
				result: reportDataResult,
			})
		} catch (error) {
			return responses.failureResponse({
				message: 'INTERNAL_SERVER_ERROR',
				statusCode: httpStatusCode.internal_server_error,
				responseCode: 'SERVER_ERROR',
				error: error.message,
			})
		}
	}

	/**
	 * Generates and uploads a CSV from the provided data.
	 */
	static async generateAndUploadCSV(data, userId, orgId) {
		const outputFileName = utils.generateFileName(common.reportOutputFile, common.csvExtension)
		const csvData = await utils.generateCSVContent(data)
		const outputFilePath = path.join(inviteeFileDir, outputFileName)
		fs.writeFileSync(outputFilePath, csvData)

		const outputFilename = path.basename(outputFilePath)
		const uploadRes = await fileUploadPath.uploadFileToCloud(outputFilename, inviteeFileDir, userId, orgId)
		return uploadRes.result.uploadDest
	}
}
