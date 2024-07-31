module.exports = {
	update: (req) => {
		req.checkBody('mentee_feedback_question_set')
			.notEmpty()
			.withMessage('mentee_feedback_question_set is required')
			.matches(/^[a-zA-Z0-9_]+$/)
			.withMessage('mentee_feedback_question_set must not contain special characters.')
		req.checkBody('mentor_feedback_question_set')
			.notEmpty()
			.withMessage('mentor_feedback_question_set field is required')
			.matches(/^[a-zA-Z0-9_]+$/)
			.withMessage('mentee_feedback_question_set must not contain special characters.')
	},
}
