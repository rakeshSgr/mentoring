const reportService = require('@services/reports')

module.exports = class Reports {
	/**
	 * Report filter list
	 * @method
	 * @name reportFilterList
	 * @param {Object} req - request data.
	 * @param {String} req.decodedToken.token - user token.
	 * @returns {JSON} - filter list.
	 */

	async filterList(req) {
		try {
			const reportFilterList = await reportService.getFilterList(
				req.query.entity_types ? req.query.entity_types : '',
				req.query.filter_type ? req.query.filter_type : '',
				req.decodedToken
			)
			return reportFilterList
		} catch (error) {
			return error
		}
	}
}
