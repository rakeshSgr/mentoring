const common = require('@constants/common')
const reportService = require('@services/reports')

module.exports = class Reports {
	/**
	 * Report filter list
	 * @method
	 * @name reportFilterList
	 * @param {Object} req - request data.
	 * @param {String} req.query.decodedToken.token - user token.
	 * @returns {JSON} - filter list.
	 */

	async filterList(req) {
		try {
			const reportFilterList = await reportService.getFilterList(
				req.query.entity_types ? req.query.entity_types : '',
				req.query.filter_type ? req.query.filter_type : '',
				req.decodedToken,
				req.query.report_filter ? req.query.report_filter : ''
			)
			return reportFilterList
		} catch (error) {
			return error
		}
	}

	/**
	 * Get Report config
	 * @method
	 * @name reportFilterList
	 * @param {Object} req - request data.
	 * @param {String} req.query.decodedToken - user token.
	 * @returns {JSON} - filter list.
	 */

	async reportData(req) {
		try {
			const reportData = await reportService.getReportData(
				req.decodedToken.id,
				req.decodedToken.organization_id,
				req.query.pageNo ? req.query.pageNo : common.pagination.DEFAULT_PAGE_NO,
				req.query.Limit ? req.query.Limit : common.pagination.DEFAULT_LIMIT,
				req.query.report_code,
				req.query.report_role ? req.query.report_role : common.MENTEE_ROLE,
				req.query.start_date ? req.query.start_date : '',
				req.query.end_date ? req.query.end_date : '',
				req.query.session_type ? req.query.session_type : common.ALL,
				req.query.entities_value,
				req.query.sort_column ? req.query.sort_column : '',
				req.query.sort_type ? req.query.sort_type : '',
				req.query.search_column ? req.query.search_column : '',
				req.query.search_value ? req.query.search_value : '',
				req.query.download_csv ? req.query.download_csv : 'false'
			)
			return reportData
		} catch (error) {
			return error
		}
	}
}
