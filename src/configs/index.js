/**
 * name : configs
 * author : Aman Kumar Gupta
 * Date : 31-Sep-2021
 * Description : Contains connections of all configs
 */

const Ajv = require('ajv')
const config = require('./search.json')

require('./kafka')()

require('./cache')()

require('./bull')()

const path = require('path')
global.PROJECT_ROOT_DIRECTORY = path.join(__dirname, '..')
;(function () {
	const schema = {
		title: 'Generated schema for Root',
		type: 'object',
		properties: {
			search: {
				type: 'object',
				properties: {
					sessionSearch: {
						type: 'object',
						properties: {
							fields: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										name: {
											type: 'string',
										},
										label: {
											type: 'string',
										},
										sortPriority: {
											type: 'number',
										},
										isAnEntityType: {
											type: 'boolean',
										},
									},
									required: ['name', 'label', 'sortPriority'],
								},
							},
						},
						required: ['fields'],
					},
					mentorSearch: {
						type: 'object',
						properties: {
							fields: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										name: {
											type: 'string',
										},
										label: {
											type: 'string',
										},
										sortPriority: {
											type: 'number',
										},
										isAnEntityType: {
											type: 'boolean',
										},
									},
									required: ['name', 'label', 'sortPriority'],
								},
							},
						},
						required: ['fields'],
					},
				},
				required: ['sessionSearch', 'mentorSearch'],
			},
		},
		required: ['search'],
	}

	const ajv = new Ajv()

	const validate = ajv.compile(schema)
	const valid = validate(config)

	if (!valid) {
		console.error('Invalid Search config:', validate.errors)
		process.exit(1)
	} else {
		console.log('Config is valid.')
	}
})()
