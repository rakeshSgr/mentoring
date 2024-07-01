const moment = require('moment')

module.exports = {
	create: (req) => {
		try {
			req.checkBody('type').isString().notEmpty().withMessage('Type is required and must be a string')

			req.checkBody('target_field')
				.isString()
				.notEmpty()
				.withMessage('Target field is required and must be a string')

			req.checkBody('is_target_from_sessions_mentor')
				.isBoolean()
				.withMessage('is_target_from_sessions_mentor must be a boolean')

			req.checkBody('requester_field')
				.isString()
				.notEmpty()
				.withMessage('Requester field is required and must be a string')

			req.checkBody('field_configs').optional().isJSON().withMessage('Field configs must be a valid JSON')

			req.checkBody('matching_operator').isString().notEmpty().withMessage('Matching operator must be a string')

			req.checkBody('requester_roles')
				.isArray({ min: 1 })
				.withMessage('Requester roles must be an array with at least one role')
				.custom((roles) => roles.every((role) => typeof role === 'string'))
				.withMessage('All roles must be strings')

			req.checkBody('role_config').isObject().withMessage('Role config must be an object')
		} catch (error) {
			console.log(error)
		}
	},

	read: (req) => {
		try {
			req.checkParams('id')
				.trim()
				.optional()
				.notEmpty()
				.withMessage('id param is empty')
				.isNumeric()
				.withMessage('id param is invalid, must be an integer')

			req.checkBody('type').trim().isString().notEmpty().withMessage('Type is required and must be a string')

			req.checkBody('target_field')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Target field is required and must be a string')

			req.checkBody('is_target_from_sessions_mentor')
				.isBoolean()
				.withMessage('is_target_from_sessions_mentor must be a boolean')

			req.checkBody('requester_field')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Requester field is required and must be a string')

			req.checkBody('field_configs').optional().isJSON().withMessage('Field configs must be a valid JSON')

			req.checkBody('matching_operator')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Matching operator must be a string')

			req.checkBody('requester_roles')
				.isArray({ min: 1 })
				.withMessage('Requester roles must be an array with at least one role')
				.custom((roles) => roles.every((role) => typeof role === 'string'))
				.withMessage('All roles must be strings')

			req.checkBody('role_config').isObject().withMessage('Role config must be an object')
		} catch (error) {
			console.log(error)
		}
	},

	update: (req) => {
		try {
			req.checkParams('id')
				.notEmpty()
				.withMessage('id param is empty')
				.isNumeric()
				.withMessage('id param is invalid, must be an integer')

			req.checkBody('type').trim().isString().notEmpty().withMessage('Type is required and must be a string')

			req.checkBody('target_field')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Target field is required and must be a string')

			req.checkBody('is_target_from_sessions_mentor')
				.isBoolean()
				.withMessage('is_target_from_sessions_mentor must be a boolean')

			req.checkBody('requester_field')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Requester field is required and must be a string')

			req.checkBody('field_configs').optional().isJSON().withMessage('Field configs must be a valid JSON')

			req.checkBody('matching_operator')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Matching operator must be a string')

			req.checkBody('requester_roles')
				.isArray({ min: 1 })
				.withMessage('Requester roles must be an array with at least one role')
				.custom((roles) => roles.every((role) => typeof role === 'string'))
				.withMessage('All roles must be strings')

			req.checkBody('role_config').isObject().withMessage('Role config must be an object')
		} catch (error) {
			console.log(error)
		}
	},

	delete: (req) => {
		try {
			req.checkParams('id')
				.notEmpty()
				.withMessage('id param is empty')
				.isNumeric()
				.withMessage('id param is invalid, must be an integer')

			req.checkBody('type').trim().isString().notEmpty().withMessage('Type is required and must be a string')

			req.checkBody('target_field')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Target field is required and must be a string')

			req.checkBody('is_target_from_sessions_mentor')
				.isBoolean()
				.withMessage('is_target_from_sessions_mentor must be a boolean')

			req.checkBody('requester_field')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Requester field is required and must be a string')

			req.checkBody('field_configs').optional().isJSON().withMessage('Field configs must be a valid JSON')

			req.checkBody('matching_operator')
				.trim()
				.isString()
				.notEmpty()
				.withMessage('Matching operator must be a string')

			req.checkBody('requester_roles')
				.isArray({ min: 1 })
				.withMessage('Requester roles must be an array with at least one role')
				.custom((roles) => roles.every((role) => typeof role === 'string'))
				.withMessage('All roles must be strings')

			req.checkBody('role_config').isObject().withMessage('Role config must be an object')
		} catch (error) {
			console.log(error)
		}
	},
}
