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

	reportData: (req) => {
		req.checkQuery('pageNo').optional().isInt({ min: 1 }).withMessage('pageNo must be a positive integer')

		req.checkQuery('Limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')

		req.checkQuery('report_code')
			.notEmpty()
			.withMessage('report_code is required')
			.matches(/^[a-z_]+$/)
			.withMessage('report_code is invalid, must not contain spaces')

		req.checkQuery('report_role')
			.notEmpty()
			.withMessage('report_role is required')
			.isIn(['mentee', 'mentor', 'admin']) // Update roles as per your use case
			.withMessage('report_role is invalid')
			.matches(/^[a-z_]+$/)
			.withMessage('report_role is invalid, must not contain spaces')

		req.checkQuery('start_date')
			.notEmpty()
			.withMessage('start_date is required')
			.matches(/^\d+$/)
			.withMessage('start_date must be in epoch format (non-negative integer)')

		req.checkQuery('end_date')
			.notEmpty()
			.withMessage('end_date is required')
			.matches(/^\d+$/)
			.withMessage('end_date must be in epoch format (non-negative integer)')

		req.checkQuery('session_type')
			.notEmpty()
			.withMessage('session_type is required')
			.isIn(['All', 'Private', 'Public'])
			.withMessage('session_type is invalid')

		req.checkQuery('entities_value')
			.trim()
			.optional()
			.withMessage('entities_value must be an string')
			.matches(/^[a-z_]+$/)
			.withMessage('entities_value is invalid, must not contain spaces')

		req.checkQuery('sort_column')
			.optional()
			.isString()
			.withMessage('sort_column must be a string')
			.matches(/^[a-z_]+$/)
			.withMessage('sort_column is invalid, must not contain spaces')

		req.checkQuery('sort_type').optional().isIn(['asc', 'desc']).withMessage('sort_type must be "asc" or "desc"')

		req.checkQuery('search_column')
			.optional()
			.isString()
			.withMessage('search_column must be a string')
			.matches(/^[a-z_]+$/)
			.withMessage('search_column is invalid, must not contain spaces')

		req.checkQuery('search_value')
			.optional()
			.isString()
			.withMessage('search_value must be a string')
			.matches(/^[a-z_]+$/)
			.withMessage('search_value is invalid, must not contain spaces')

		req.checkQuery('download_csv')
			.optional()
			.isIn(['true', 'false'])
			.withMessage('download_csv must be "true" or "false"')
	},
}
