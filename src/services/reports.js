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
		searchValue
	) {
		try {
			let reportDataResult = {}

			// Check report permissions
			const checkReportPermission = await reportMappingQueries.findReportRoleMappingByReportCode(reportCode)
			if (!checkReportPermission || checkReportPermission.dataValues.role_title !== reportRole) {
				return responses.failureResponse({
					message: 'REPORT_CODE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Fetch report configuration and type
			const reportConfig = await reportsQueries.findReportByCode(reportCode)
			reportDataResult = {
				report_type: reportConfig.dataValues.report_type_title,
				config: reportConfig.dataValues.config,
			}

			// Fetch report query
			const reportQuery = await reportQueryQueries.findReportQueryByCode(reportCode)
			let query = reportQuery.query

			// Replace placeholders
			const replacements = {
				userId: userId || null,
				start_date: startDate || null,
				end_date: endDate || null,
				entities_value: entitiesValue ? `{${entitiesValue}}` : null,
				session_type: sessionType ? utils.convertToTitleCase(sessionType) : null,
				limit: limit || common.pagination.DEFAULT_LIMIT,
				offset: common.getPaginationOffset(page, limit),
				sort_column: sortColumn || '',
				sort_type: sortType || 'ASC',
				search_column: searchColumn || null,
				search_value: searchValue || null,
			}

			query = query.replace(/:sort_type/g, replacements.sort_type)

			// Execute the main query
			const result = await sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT })

			// Remove LIMIT and OFFSET from the query
			const removeLimitAndOffset = (sql) => sql.replace(/\s*LIMIT\s+\S+\s+OFFSET\s+\S+/, '')
			const resultWithoutPagination = await sequelize.query(removeLimitAndOffset(query), {
				replacements,
				type: sequelize.QueryTypes.SELECT,
			})

			// Process query results
			if (result?.length) {
				const flattenedResult = { ...result[0] }
				reportDataResult.data =
					reportDataResult.report_type === common.REPORT_TABLE ? [...result] : flattenedResult
			}

			if (resultWithoutPagination?.length) {
				const outputFilePath = await this.generateAndUploadCSV(resultWithoutPagination, userId, orgId)
				reportDataResult.reportsDownloadUrl = await utils.getDownloadableUrl(outputFilePath)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'REPORT_DATA_SUCCESSFULLY_FETCHED',
				result: reportDataResult,
			})
		} catch (error) {
			console.error('Error in getReportData:', error)
			throw error
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
