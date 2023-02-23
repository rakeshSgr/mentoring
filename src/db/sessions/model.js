/**
 * name : models/sessions/schema
 * author : Aman Karki
 * Date : 07-Oct-2021
 * Description : Sessions schema data
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongooseLeanGetter = require('mongoose-lean-getters')
const utils = require('./utils')

let sessionsSchema = new Schema({
	title: String,
	description: String,
	recommendedFor: Array,
	categories: Array,
	medium: Array,
	image: Array,
	userId: {
		type: mongoose.Types.ObjectId,
		index: true,
	},

	sessionReschedule: Number,
	status: {
		type: String,
		index: true,
		default: 'published',
	},
	deleted: {
		type: Boolean,
		default: false,
	},
	timeZone: String,
	startDate: String,
	endDate: String,
	startDateUtc: String,
	endDateUtc: String,
	link: String,
	menteePassword: String,
	mentorPassword: String,
	startedAt: Date,
	shareLink: String,
	completedAt: Date,
	feedbacks: [
		{
			questionId: mongoose.Types.ObjectId,
			value: String,
			label: String,
		},
	],
	skippedFeedback: {
		type: Boolean,
		default: false,
	},
	isStarted: {
		type: Boolean,
		default: false,
	},
	menteeFeedbackForm: {
		type: String,
		default: 'menteeQS1',
	},
	mentorFeedbackForm: {
		type: String,
		default: 'mentorQS2',
	},
	recordings: Object,
	recordingUrl: {
		type: String,
		default: null,
	},
	internalMeetingId: {
		type: String,
		default: null,
	},
	summary: {
		type: String,
		default: null,
	},
})
/* sessionsSchema.post(['save', 'updateOne'], function () {
	// ["method1", "method2", "method3"...]
	utils.sessionDataToKafka
}) */
/* sessionsSchema.post('save', utils.sessionDataToKafka)
sessionsSchema.post('findOneAndUpdate', function (doc) {
	utils.sessionDataToKafka(doc)
}) */
sessionsSchema.plugin(mongooseLeanGetter)
const Sessions = db.model('sessions', sessionsSchema)
module.exports = Sessions
