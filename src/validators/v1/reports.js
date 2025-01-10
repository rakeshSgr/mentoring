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

		req.checkQuery('session_type').notEmpty().withMessage('session_type is required')

		req.checkQuery('entities_value')
			.trim()
			.optional()
			.isString()
			.withMessage('entities_value must be an string')
			.matches(/^[a-z_]*$/)
			.withMessage('entities_value is invalid, must not contain spaces')

		req.checkQuery('sort_column')
			.optional()
			.isString()
			.withMessage('sort_column must be a string')
			.matches(/^[a-z_]*$/)
			.withMessage('sort_column is invalid, must not contain spaces')

		req.checkQuery('sort_type')
			.optional()
			.isString()
			.withMessage('sort_column must be a string')
			.matches(/^[A-Za-z]*$/)
			.withMessage('sort_column is invalid, must be')

		req.checkQuery('search_column')
			.optional()
			.isString()
			.withMessage('search_column must be a string')
			.matches(/^[a-z_]*$/)
			.withMessage('search_column is invalid, must not contain spaces')

		req.checkQuery('search_value').optional().isString().withMessage('search_value must be a string')

		req.checkQuery('download_csv')
			.optional()
			.isIn(['true', 'false'])
			.withMessage('download_csv must be "true" or "false"')
	},

	create: (req) => {
		req.checkBody('code')
			.notEmpty()
			.withMessage('code field is empty')
			.matches(/^[a-z_]+$/)
			.withMessage('code should not contain any spaces')

		req.checkBody('title')
			.notEmpty()
			.withMessage('title field is empty')
			.matches(/^[a-z_]+$/)
			.withMessage('title should not contain any spaces')

		req.checkBody('description').notEmpty().withMessage('description field is empty')

		req.checkBody('report_type_title')
			.notEmpty()
			.withMessage('report_type_title field is required')
			.matches(/^[a-z_]+$/)
			.withMessage('report_type_title should not contain any spaces')

		req.checkBody('config')
			.notEmpty('config field is required')
			.withMessage()
			.custom((value) => {
				try {
					JSON.parse(value)
					return true
				} catch (e) {
					throw new Error('config should be a valid JSON object')
				}
			})

		req.checkBody('organization_id').optional().notEmpty().isInt().withMessage('organization_id field is empty')
	},

	getReportById: (req) => {
		req.checkQuery('id').notEmpty().withMessage('id is required')
	},

	update: (req) => {
		req.checkQuery('id').notEmpty().withMessage('id is required')

		req.checkBody('code')
			.optional()
			.notEmpty()
			.withMessage('code field is empty')
			.matches(/^[a-z_]+$/)
			.withMessage('code should not contain any spaces')

		req.checkBody('title')
			.optional()
			.notEmpty()
			.withMessage('title field is empty')
			.matches(/^[a-z_]+$/)
			.withMessage('title should not contain any spaces')

		req.checkBody('description').optional().notEmpty().withMessage('description field is empty')

		req.checkBody('report_type_title')
			.optional()
			.notEmpty()
			.withMessage('report_type_title field is empty')
			.matches(/^[a-z_]+$/)
			.withMessage('report_type_title should not contain any spaces')

		req.checkBody('config')
			.optional()
			.custom((value) => {
				try {
					JSON.parse(value)
					return true
				} catch (e) {
					throw new Error('config should be a valid JSON object')
				}
			})

		req.checkBody('organization_id').optional().notEmpty().isInt().withMessage('organization_id field is empty')
	},

	delete: (req) => {
		req.checkQuery('id').notEmpty().withMessage('id is required')
	},
}
