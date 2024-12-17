const { filterRequestBody } = require('../common')

module.exports = {
	filterList: (req) => {
		req.checkQuery('filter_type')
			.notEmpty()
			.withMessage('filter_type query is empty')
			.isIn(['session'])
			.withMessage('filterType is invalid')

		req.checkQuery('report_filter').optional().isIn(['true', 'false']).withMessage('report_type is invalid')
	},
}
