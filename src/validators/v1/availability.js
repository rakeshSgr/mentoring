const moment = require('moment')

module.exports = {
	create: (req) => {
		try {
			req.checkBody('event_name').optional().notEmpty().withMessage('Event name is required')
			req.checkBody('start_time').isInt().withMessage('Start time must be a valid Unix timestamp')
			req.checkBody('end_time').isInt().withMessage('End time must be a valid Unix timestamp')
			req.checkBody('expiration_date')
				.optional()
				.isInt()
				.withMessage('Expiration date must be a valid Unix timestamp')
			req.checkBody('repeat_unit')
				.optional()
				.isIn(['DAY', 'WEEK', 'MONTH', 'YEAR'])
				.withMessage('Invalid repeat unit')
			req.checkBody('repeat_increment')
				.optional()
				.isInt({ min: 1 })
				.withMessage('Repeat increment must be a positive integer')

			// Validate repeat_on array
			req.checkBody('repeat_on').optional().isArray().withMessage('Repeat on must be an array')
			req.checkBody('repeat_on.*')
				.optional()
				.isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
				.withMessage('Invalid day in repeat on')

			// Validate occurrence_in_month for monthly events
			req.checkBody(['repeat_unit', 'occurrence_in_month']).custom(function (value) {
				console.log(req.body.occurrence_in_month && req.body.repeat_unit !== 'MONTH')
				if (req.body.occurrence_in_month && req.body.repeat_unit !== 'MONTH') {
					throw new Error('Occurrence in month is only valid for monthly events')
				}
				return true
			})

			// Validate start_date if occurrence_in_month is provided
			req.checkBody(['start_time', 'occurrence_in_month']).custom(function (value) {
				if (req.body.occurrence_in_month) {
					const startDate = moment.unix(req.body.start_time)
					const occurrenceDate = startDate
						.clone()
						.set('date', 1)
						.day(req.body.repeat_on[0])
						.add(req.body.occurrence_in_month - 1, 'week')
					if (!startDate.isSame(occurrenceDate, 'month')) {
						throw new Error('Occurrence in month does not match start date')
					}
				}
				return true
			})

			// Validate if repeat_on matches with the event start date
			req.checkBody(['start_time', 'repeat_on']).custom(function (value) {
				if (req.body.repeat_on && req.body.start_time && req.body.repeat_unit == 'MONTH') {
					const startDate = moment.unix(req.body.start_time).startOf('day')
					const startDay = startDate.format('dddd')
					console.log(startDay)
					if (!req.body.repeat_on.includes(startDay)) {
						throw new Error('Repeat on does not match event start day')
					}
				}
				return true
			})

			return req.validationErrors()
		} catch (error) {
			console.log(error)
		}
	},
	update: (req) => {
		try {
			req.checkParams('id').notEmpty().withMessage('id param is empty')
			// All fields are optional for update
			req.checkBody('event_name').optional()
			req.checkBody('start_time').optional().isInt().withMessage('Start time must be a valid Unix timestamp')
			req.checkBody('end_time').optional().isInt().withMessage('End time must be a valid Unix timestamp')
			req.checkBody('expiration_date')
				.optional()
				.isInt()
				.withMessage('Expiration date must be a valid Unix timestamp')
			req.checkBody('repeat_unit')
				.optional()
				.isIn(['DAY', 'WEEK', 'MONTH', 'YEAR'])
				.withMessage('Invalid repeat unit')
			req.checkBody('repeat_increment')
				.optional()
				.isInt({ min: 1 })
				.withMessage('Repeat increment must be a positive integer')

			// Validate repeat_on array
			req.checkBody('repeat_on').optional().isArray().withMessage('Repeat on must be an array')
			req.checkBody('repeat_on.*')
				.optional()
				.isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
				.withMessage('Invalid day in repeat on')

			// Validate occurrence_in_month for monthly events
			req.checkBody(['repeat_unit', 'occurrence_in_month'])
				.optional()
				.custom(function (value) {
					if (req.body.occurrence_in_month && req.body.repeat_unit !== 'MONTH') {
						throw new Error('Occurrence in month is only valid for monthly events')
					}
					return true
				})

			// Validate start_date if occurrence_in_month is provided
			req.checkBody(['start_time', 'occurrence_in_month'])
				.optional()
				.custom(function (value) {
					if (req.body.occurrence_in_month) {
						const startDate = moment.unix(req.body.start_time)
						const occurrenceDate = startDate
							.clone()
							.set('date', 1)
							.day(req.body.repeat_on[0])
							.add(req.body.occurrence_in_month - 1, 'week')
						if (!startDate.isSame(occurrenceDate, 'month')) {
							throw new Error('Occurrence in month does not match start date')
						}
					}
					return true
				})

			// Validate if repeat_on matches with the event start date
			req.checkBody(['start_time', 'repeat_on'])
				.optional()
				.custom(function (value) {
					if (req.body.repeat_on && req.body.start_time && req.body.repeat_unit == 'MONTH') {
						const startDate = moment.unix(req.body.start_time).startOf('day')
						const startDay = startDate.format('dddd')
						if (!req.body.repeat_on.includes(startDay)) {
							throw new Error('Repeat on does not match event start day')
						}
					}
					return true
				})

			return req.validationErrors()
		} catch (error) {
			console.log(error)
		}
	},
	delete: (req) => {
		req.checkParams('id').notEmpty().withMessage('id param is empty')
	},
	read: (req) => {
		req.checkParams('id').notEmpty().withMessage('id param is empty')
		req.checkQuery('startEpoch')
			.trim()
			.notEmpty()
			.withMessage('startEpoch field is empty')
			.isInt()
			.withMessage('Start time must be a valid Unix timestamp')
		req.checkQuery('endEpoch')
			.trim()
			.notEmpty()
			.withMessage('endEpoch field is empty')
			.isInt()
			.withMessage('End time must be a valid Unix timestamp')
	},
	isAvailable: (req) => {
		req.checkParams('id').notEmpty().withMessage('id param is empty')
		req.checkQuery('startEpoch')
			.trim()
			.notEmpty()
			.withMessage('startEpoch field is empty')
			.isInt()
			.withMessage('Start time must be a valid Unix timestamp')
		req.checkQuery('endEpoch')
			.trim()
			.notEmpty()
			.withMessage('endEpoch field is empty')
			.isInt()
			.withMessage('End time must be a valid Unix timestamp')
	},
	users: (req) => {
		req.checkQuery('startEpoch')
			.trim()
			.notEmpty()
			.withMessage('startEpoch field is empty')
			.isInt()
			.withMessage('Start time must be a valid Unix timestamp')
		req.checkQuery('endEpoch')
			.trim()
			.notEmpty()
			.withMessage('endEpoch field is empty')
			.isInt()
			.withMessage('End time must be a valid Unix timestamp')
	},
}
