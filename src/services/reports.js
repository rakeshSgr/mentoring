const menteesService = require('@services/mentees')
const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')
const common = require('@constants/common')

module.exports = class ReportsHelper {
	/**
	 * Get entityTypes for reports
	 * @method
	 * @name getReportFilterList
	 * @param {String} tokenInformation - token information
	 * @param {Boolean} queryParams - queryParams
	 * @returns {JSON} - Report filter list.
	 */
	static async getReportFilterList(organization, entity_type, filterType, tokenInformation) {
		try {
			const reportFilterList = await menteesService.getFilterList(
				organization,
				entity_type,
				filterType,
				tokenInformation
			)
			let result = reportFilterList.result

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
				result.roles = tokenInformation.roles
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'REPORT_FILTER_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			return error
		}
	}
}
