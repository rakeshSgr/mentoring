/**
 * name : validators/v1/questions.js
 * author : Rakesh Kumar
 * Date : 01-Dec-2021
 * Description : Validations of user questions controller
 */
const { filterRequestBody } = require('../common')
const { questionSet } = require('@constants/blacklistConfig')
module.exports = {
	read: (req) => {
		req.checkParams('id')
			.notEmpty()
			.withMessage('id param is empty')
			.isInt()
			.withMessage('id param should be number')
	},
	update: (req) => {
		req.body = filterRequestBody(req.body, questionSet.update)

		req.checkBody('questions').optional().notEmpty().withMessage('questions field is empty')
		req.checkBody('code').optional().notEmpty().withMessage('code field is empty')
		req.checkParams('id').notEmpty().withMessage('id param is empty')
	},
	create: (req) => {
		req.body = filterRequestBody(req.body, questionSet.create)

		req.checkBody('questions')
			.notEmpty()
			.withMessage('questions field is empty')
			.isArray({ min: 1 })
			.withMessage('questions must be an array')

		req.checkBody('code')
			.notEmpty()
			.withMessage('code field is empty')
			.matches(/^[a-zA-Z0-9_]+$/)
			.withMessage('code must be alphanumeric')
	},
}
