module.exports = {
	update: (req) => {
		req.checkBody('mentee_feedback_question_set').notEmpty().withMessage('mentee_feedback_question_set is empty')
		req.checkBody('mentor_feedback_question_set')
			.notEmpty()
			.withMessage('mentor_feedback_question_set field is empty')
	},
}
