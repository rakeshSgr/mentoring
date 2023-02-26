// Dependencies
const ObjectId = require('mongoose').Types.ObjectId
const moment = require('moment-timezone')
const httpStatusCode = require('@generics/http-status')
const apiEndpoints = require('@constants/endpoints')
const common = require('@constants/common')
const sessionData = require('@db/sessions/queries')
const sessionAttendesData = require('@db/sessionAttendees/queries')
const notificationTemplateData = require('@db/notification-template/query')
const sessionAttendeesHelper = require('./sessionAttendees')
const kafkaCommunication = require('@generics/kafka-communication')
const apiBaseUrl = process.env.USER_SERIVCE_HOST + process.env.USER_SERIVCE_BASE_URL
const request = require('request')

const bigBlueButton = require('./bigBlueButton')
const userProfile = require('./userProfile')
const utils = require('@generics/utils')
const sessionMentor = require('./mentors')

const sessionDTO = require('../../dto/sessions')

const axios = require('axios')

module.exports = class SessionsHelper {
	/**
	 * Create session.
	 * @method
	 * @name create
	 * @param {Object} bodyData - Session creation data.
	 * @param {String} loggedInUserId - logged in user id.
	 * @returns {JSON} - Create session data.
	 */

	static async create(bodyData, loggedInUserId) {
		bodyData.userId = ObjectId(loggedInUserId)
		try {
			const mentorStatus = await this.verifyMentor(loggedInUserId)

			if (mentorStatus === false) {
				return common.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (bodyData.startDate) {
				bodyData['startDateUtc'] = moment.unix(bodyData.startDate).utc().format(common.UTC_DATE_TIME_FORMAT)
			}
			if (bodyData.endDate) {
				bodyData['endDateUtc'] = moment.unix(bodyData.endDate).utc().format(common.UTC_DATE_TIME_FORMAT)
			}

			let elapsedMinutes = moment(bodyData.endDateUtc).diff(bodyData.startDateUtc, 'minutes')

			if (elapsedMinutes < 30) {
				return common.failureResponse({
					message: 'SESSION__MINIMUM_DURATION_TIME',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (elapsedMinutes > 1440) {
				return common.failureResponse({
					message: 'SESSION_DURATION_TIME',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			let data = await sessionData.createSession(bodyData)

			await this.setMentorPassword(data._id, data.userId.toString())
			await this.setMenteePassword(data._id, data.createdAt)

			let transformedSessionData = await sessionDTO.transformSessionData(data._id, ObjectId(loggedInUserId))
			kafkaCommunication.pushSessionToKafka(transformedSessionData)
			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'SESSION_CREATED_SUCCESSFULLY',
				result: data,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Update session.
	 * @method
	 * @name update
	 * @param {String} sessionId - Session id.
	 * @param {Object} bodyData - Session creation data.
	 * @param {String} userId - logged in user id.
	 * @param {String} method - method name.
	 * @returns {JSON} - Update session data.
	 */

	static async update(sessionId, bodyData, userId, method) {
		let isSessionReschedule = false
		try {
			if (!(await this.verifyMentor(userId))) {
				return common.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const sessionDetail = await sessionData.findSessionById(ObjectId(sessionId))

			if (!sessionDetail) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (bodyData.startDate) {
				bodyData['startDateUtc'] = moment.unix(bodyData.startDate).utc().format(common.UTC_DATE_TIME_FORMAT)
				isSessionReschedule = true
			}
			if (bodyData.endDate) {
				bodyData['endDateUtc'] = moment.unix(bodyData.endDate).utc().format(common.UTC_DATE_TIME_FORMAT)
				isSessionReschedule = true
			}

			if (method != common.DELETE_METHOD) {
				let elapsedMinutes = moment(bodyData.endDateUtc).diff(bodyData.startDateUtc, 'minutes')

				if (elapsedMinutes < 30) {
					return common.failureResponse({
						message: 'SESSION__MINIMUM_DURATION_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				if (elapsedMinutes > 1440) {
					return common.failureResponse({
						message: 'SESSION_DURATION_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			}

			let message
			let updateData
			if (method == common.DELETE_METHOD) {
				updateData = {
					deleted: true,
				}
				message = 'SESSION_DELETED_SUCCESSFULLY'
			} else {
				updateData = bodyData
				message = 'SESSION_UPDATED_SUCCESSFULLY'
			}

			updateData.updatedAt = new Date().getTime()
			const result = await sessionData.updateOneSession(
				{
					_id: ObjectId(sessionId),
				},
				updateData,
				{ new: true, rawResult: true }
			)
			let transformedSessionData = await sessionDTO.transformSessionData(sessionId, ObjectId(userId))
			kafkaCommunication.pushSessionToKafka(transformedSessionData)
			if (result === 'SESSION_ALREADY_UPDATED') {
				return common.failureResponse({
					message: 'SESSION_ALREADY_UPDATED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (method == common.DELETE_METHOD || isSessionReschedule) {
				const sessionAttendees = await sessionAttendesData.findAllSessionAttendees({
					sessionId: ObjectId(sessionId),
				})
				const sessionAttendeesIds = []
				sessionAttendees.forEach((attendee) => {
					sessionAttendeesIds.push(attendee.userId.toString())
				})

				const attendeesAccounts = await sessionAttendeesHelper.getAllAccountsDetail(sessionAttendeesIds)

				sessionAttendees.map((attendee) => {
					for (let index = 0; index < attendeesAccounts.result.length; index++) {
						const element = attendeesAccounts.result[index]
						if (element._id == attendee.userId) {
							attendee.attendeeEmail = element.email.address
							attendee.attendeeName = element.name
							break
						}
					}
				})

				/* Find email template according to request type */
				let templateData
				if (method == common.DELETE_METHOD) {
					templateData = await notificationTemplateData.findOneEmailTemplate(
						process.env.MENTOR_SESSION_DELETE_EMAIL_TEMPLATE
					)
				} else if (isSessionReschedule) {
					templateData = await notificationTemplateData.findOneEmailTemplate(
						process.env.MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE
					)
				}

				sessionAttendees.forEach(async (attendee) => {
					if (method == common.DELETE_METHOD && attendee.sendNotification) {
						const payload = {
							type: 'email',
							email: {
								to: attendee.attendeeEmail,
								subject: templateData.subject,
								body: utils.composeEmailBody(templateData.body, {
									name: attendee.attendeeName,
									sessionTitle: sessionDetail.title,
								}),
							},
						}

						await kafkaCommunication.pushEmailToKafka(payload)
					} else if (isSessionReschedule && attendee.sendNotification) {
						const payload = {
							type: 'email',
							email: {
								to: attendee.attendeeEmail,
								subject: templateData.subject,
								body: utils.composeEmailBody(templateData.body, {
									name: attendee.attendeeName,
									sessionTitle: sessionDetail.title,
									oldStartDate: utils.getTimeZone(
										sessionDetail.startDateUtc
											? sessionDetail.startDateUtc
											: sessionDetail.startDate,
										common.dateFormat,
										sessionDetail.timeZone
									),
									oldStartTime: utils.getTimeZone(
										sessionDetail.startDateUtc
											? sessionDetail.startDateUtc
											: sessionDetail.startDate,
										common.timeFormat,
										sessionDetail.timeZone
									),
									oldEndDate: utils.getTimeZone(
										sessionDetail.endDateUtc ? sessionDetail.endDateUtc : sessionDetail.endDate,
										common.dateFormat,
										sessionDetail.timeZone
									),
									oldEndTime: utils.getTimeZone(
										sessionDetail.endDateUtc ? sessionDetail.endDateUtc : sessionDetail.endDate,
										common.timeFormat,
										sessionDetail.timeZone
									),
									newStartDate: utils.getTimeZone(
										bodyData['startDateUtc']
											? bodyData['startDateUtc']
											: sessionDetail.startDateUtc,
										common.dateFormat,
										sessionDetail.timeZone
									),
									newStartTime: utils.getTimeZone(
										bodyData['startDateUtc']
											? bodyData['startDateUtc']
											: sessionDetail.startDateUtc,
										common.timeFormat,
										sessionDetail.timeZone
									),
									newEndDate: utils.getTimeZone(
										bodyData['endDateUtc'] ? bodyData['endDateUtc'] : sessionDetail.endDateUtc,
										common.dateFormat,
										sessionDetail.timeZone
									),
									newEndTime: utils.getTimeZone(
										bodyData['endDateUtc'] ? bodyData['endDateUtc'] : sessionDetail.endDateUtc,
										common.timeFormat,
										sessionDetail.timeZone
									),
								}),
							},
						}

						await kafkaCommunication.pushEmailToKafka(payload)
					}
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: message,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Session details.
	 * @method
	 * @name details
	 * @param {String} id - Session id.
	 * @param {String} userId - logged in user id.
	 * @returns {JSON} - Session details
	 */

	static async details(id, userId = '') {
		try {
			const filter = {}
			const projection = {
				shareLink: 0,
				menteePassword: 0,
				mentorPassword: 0,
			}

			if (ObjectId.isValid(id)) {
				filter._id = id
			} else {
				filter.shareLink = id
			}

			const sessionDetails = await sessionData.findOneSession(filter, projection)

			if (!sessionDetails) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (userId) {
				let sessionAttendee = await sessionAttendesData.findOneSessionAttendee(sessionDetails._id, userId)
				sessionDetails.isEnrolled = false
				if (sessionAttendee) {
					sessionDetails.isEnrolled = true
				}
			}

			if (sessionDetails.image && sessionDetails.image.some(Boolean)) {
				sessionDetails.image = sessionDetails.image.map(async (imgPath) => {
					if (imgPath != '') {
						return await utils.getDownloadableUrl(imgPath)
					}
				})
				sessionDetails.image = await Promise.all(sessionDetails.image)
			}
			const mentorName = await userProfile.details('', sessionDetails.userId)
			sessionDetails.mentorName = mentorName.data.result.name

			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: sessionDetails,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Session list.
	 * @method
	 * @name list
	 * @param {String} loggedInUserId - LoggedIn user id.
	 * @param {Number} page - page no.
	 * @param {Number} limit - page size.
	 * @param {String} search - search text.
	 * @returns {JSON} - List of sessions
	 */

	static async list(loggedInUserId, page, limit, search, status) {
		try {
			// update sessions which having status as published and  exceeds the current date and time
			await sessionData.updateSession(
				{
					status: common.PUBLISHED_STATUS,
					endDateUtc: {
						$lt: moment().utc().format(),
					},
				},
				{
					status: common.COMPLETED_STATUS,
				}
			)

			let arrayOfStatus = []
			if (status && status != '') {
				arrayOfStatus = status.split(',')
			}

			let filters = {
				userId: ObjectId(loggedInUserId),
			}
			if (arrayOfStatus.length > 0) {
				if (arrayOfStatus.includes(common.COMPLETED_STATUS) && arrayOfStatus.length == 1) {
					filters['endDateUtc'] = {
						$lt: moment().utc().format(),
					}
				} else if (
					arrayOfStatus.includes(common.PUBLISHED_STATUS) &&
					arrayOfStatus.includes(common.LIVE_STATUS)
				) {
					filters['endDateUtc'] = {
						$gte: moment().utc().format(),
					}
				}

				filters['status'] = {
					$in: arrayOfStatus,
				}
			}
			const sessionDetails = await sessionData.findAllSessions(page, limit, search, filters)
			if (sessionDetails[0] && sessionDetails[0].data.length == 0 && search !== '') {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: [],
				})
			}

			sessionDetails[0].data = await sessionMentor.sessionMentorDetails(sessionDetails[0].data)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: sessionDetails[0] ? sessionDetails[0] : [],
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Enroll Session.
	 * @method
	 * @name enroll
	 * @param {String} sessionId - Session id.
	 * @param {Object} userTokenData
	 * @param {String} userTokenData._id - user id.
	 * @param {String} userTokenData.email - user email.
	 * @param {String} userTokenData.name - user name.
	 * @param {String} timeZone - timezone.
	 * @returns {JSON} - Enroll session.
	 */

	static async enroll(sessionId, userTokenData, timeZone) {
		const userId = userTokenData._id
		const email = userTokenData.email
		const name = userTokenData.name
		try {
			let sendNotification = true
			if ('sendNotification' in userTokenData) {
				sendNotification = userTokenData.sendNotification
			}

			const session = await sessionData.findSessionById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorName = await userProfile.details('', session.userId)
			session.mentorName = mentorName.data.result.name

			const sessionAttendeeExist = await sessionAttendesData.findOneSessionAttendee(sessionId, userId)
			if (sessionAttendeeExist) {
				return common.failureResponse({
					message: 'USER_ALREADY_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let link = encodeURI(
				process.env.APPLICATION_URL +
					process.env.APPLICATION_BASE_URL +
					'v1/sessions/join/' +
					sessionId +
					'?user=' +
					userId +
					'&name=' +
					name
			)

			const attendee = {
				userId,
				sessionId,
				timeZone,
				link,
				sendNotification,
			}

			let sessionAttendees = await sessionAttendesData.create(attendee)
			const templateData = await notificationTemplateData.findOneEmailTemplate(
				process.env.MENTEE_SESSION_ENROLLMENT_EMAIL_TEMPLATE
			)

			if (templateData && sendNotification) {
				// Push successful enrollment to session in kafka
				const payload = {
					type: 'email',
					email: {
						to: email,
						subject: templateData.subject,
						body: utils.composeEmailBody(templateData.body, {
							name,
							sessionTitle: session.title,
							mentorName: session.mentorName,
							startDate: utils.getTimeZone(
								session.startDateUtc ? session.startDateUtc : session.startDate,
								common.dateFormat,
								session.timeZone
							),
							startTime: utils.getTimeZone(
								session.startDateUtc ? session.startDateUtc : session.startDate,
								common.timeFormat,
								session.timeZone
							),
						}),
					},
				}

				await kafkaCommunication.pushEmailToKafka(payload)
			}

			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'USER_ENROLLED_SUCCESSFULLY',
				result: sessionAttendees,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * UnEnroll Session.
	 * @method
	 * @name enroll
	 * @param {String} sessionId - Session id.
	 * @param {Object} userTokenData
	 * @param {String} userTokenData._id - user id.
	 * @param {String} userTokenData.email - user email.
	 * @param {String} userTokenData.name - user name.
	 * @returns {JSON} - UnEnroll session.
	 */

	static async unEnroll(sessionId, userTokenData) {
		const userId = userTokenData._id
		const name = userTokenData.name
		const email = userTokenData.email

		try {
			let sendNotification = true
			if ('sendNotification' in userTokenData) {
				sendNotification = userTokenData.sendNotification
			}

			const session = await sessionData.findSessionById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorName = await userProfile.details('', session.userId)
			session.mentorName = mentorName.data.result.name

			const response = await sessionAttendesData.unEnrollFromSession(sessionId, userId)

			if (response === 'USER_NOT_ENROLLED') {
				return common.failureResponse({
					message: 'USER_NOT_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const templateData = await notificationTemplateData.findOneEmailTemplate(
				process.env.MENTEE_SESSION_CANCELLATION_EMAIL_TEMPLATE
			)

			if (templateData && sendNotification) {
				// Push successful unenrollment to session in kafka
				const payload = {
					type: 'email',
					email: {
						to: email,
						subject: templateData.subject,
						body: utils.composeEmailBody(templateData.body, {
							name,
							sessionTitle: session.title,
							mentorName: session.mentorName,
						}),
					},
				}

				await kafkaCommunication.pushEmailToKafka(payload)
			}

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'USER_UNENROLLED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Verify whether user is a mentor
	 * @method
	 * @name verifyMentor
	 * @param {String} id - user id.
	 * @returns {Boolean} - true/false.
	 */

	static async verifyMentor(id) {
		return new Promise((resolve, reject) => {
			try {
				let options = {
					headers: {
						'Content-Type': 'application/json',
						internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
					},
				}

				let apiUrl = apiBaseUrl + apiEndpoints.VERIFY_MENTOR + '?userId=' + id

				try {
					request.post(apiUrl, options, (err, data) => {
						if (err) {
							return reject({
								message: 'USER_SERVICE_DOWN',
							})
						} else {
							data.body = JSON.parse(data.body)
							if (data.body.result && data.body.result.isAMentor) {
								return resolve(true)
							} else {
								return resolve(false)
							}
						}
					})
				} catch (error) {
					reject(error)
				}
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Share a session.
	 * @method
	 * @name share
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - Session share link.
	 */

	static async share(sessionId) {
		try {
			const session = await sessionData.findSessionById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let shareLink = session.shareLink
			if (!shareLink) {
				shareLink = utils.md5Hash(sessionId + '###' + session.userId.toString())
				await sessionData.updateOneSession(
					{
						_id: ObjectId(sessionId),
					},
					{
						shareLink,
					}
				)
			}
			return common.successResponse({
				message: 'SESSION_LINK_GENERATED_SUCCESSFULLY',
				statusCode: httpStatusCode.ok,
				result: {
					shareLink,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * List of upcoming sessions.
	 * @method
	 * @name upcomingPublishedSessions
	 * @param {Number} page - page no.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search text.
	 * @returns {JSON} - List of upcoming sessions.
	 */

	static async upcomingPublishedSessions(page, limit, search) {
		try {
			const publishedSessions = await sessionData.searchAndPagination(page, limit, search)
			return publishedSessions
		} catch (error) {
			return error
		}
	}

	/**
	 * Start session.
	 * @method
	 * @name start
	 * @param {String} sessionId - session id.
	 * @param {String} token - token information.
	 * @returns {JSON} - start session link
	 */

	static async start(sessionId, token) {
		try {
			const mentor = await userProfile.details(token)

			if (mentor.data.responseCode !== 'OK') {
				return common.failureResponse({
					message: 'MENTORS_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorDetails = mentor.data.result

			if (!mentorDetails.isAMentor) {
				return common.failureResponse({
					message: 'NOT_A_MENTOR',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const session = await sessionData.findSessionById(sessionId)

			if (!session) {
				return resolve(
					common.failureResponse({
						message: 'SESSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				)
			}

			if (session.userId.toString() !== mentor.data.result._id) {
				return common.failureResponse({
					message: 'CANNOT_START_OTHER_MENTOR_SESSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			let link = ''
			if (session.link) {
				link = session.link
			} else {
				let currentDate = moment().utc().format(common.UTC_DATE_TIME_FORMAT)
				let elapsedMinutes = moment(session.startDateUtc).diff(currentDate, 'minutes')

				if (elapsedMinutes > 10) {
					return common.failureResponse({
						message: 'SESSION_ESTIMATED_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				const meetingDetails = await bigBlueButton.createMeeting(
					session._id,
					session.title,
					session.menteePassword,
					session.mentorPassword
				)

				if (!meetingDetails.success) {
					return common.failureResponse({
						message: apiResponses.MEETING_NOT_CREATED,
						statusCode: httpStatusCode.internal_server_error,
						responseCode: 'SERVER_ERROR',
					})
				}

				const moderatorMeetingLink = await bigBlueButton.joinMeetingAsModerator(
					session._id,
					mentorDetails.name,
					session.mentorPassword
				)

				await sessionData.updateOneSession(
					{
						_id: session._id,
					},
					{
						link: moderatorMeetingLink,
						status: 'live',
						isStarted: true,
						startedAt: utils.utcFormat(),
						internalMeetingId: meetingDetails.data.response.internalMeetingID,
					}
				)

				link = moderatorMeetingLink
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_START_LINK',
				result: {
					link: link,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Set mentor password in session collection..
	 * @method
	 * @name setMentorPassword
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @returns {JSON} - updated session data.
	 */

	static async setMentorPassword(sessionId, userId) {
		try {
			let hashPassword = utils.hash(sessionId + userId)
			const result = await sessionData.updateOneSession(
				{
					_id: sessionId,
				},
				{
					mentorPassword: hashPassword,
				}
			)

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Set mentee password in session collection.
	 * @method
	 * @name setMenteePassword
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @returns {JSON} - update session data.
	 */

	static async setMenteePassword(sessionId, createdAt) {
		try {
			let hashPassword = utils.hash(sessionId + createdAt)
			const result = await sessionData.updateOneSession(
				{
					_id: sessionId,
				},
				{
					menteePassword: hashPassword,
				}
			)

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Update session collection status to completed.
	 * @method
	 * @name completed
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - updated session data.
	 */

	static async completed(sessionId) {
		try {
			const recordingInfo = await bigBlueButton.getRecordings(sessionId)

			const result = await sessionData.updateOneSession(
				{
					_id: sessionId,
				},
				{
					status: 'completed',
					recordings: recordingInfo.data.response.recordings,
					completedAt: utils.utcFormat(),
				}
			)

			if (
				recordingInfo.data.response.recordings &&
				recordingInfo.data.response.recordings.recording &&
				recordingInfo.data.response.recordings.recording.playback
			) {
				const sessionDetails = await sessionData.findOneSession({ _id: sessionId })

				let formatData = recordingInfo.data.response.recordings.recording.playback.format

				let recordingUrl = ''
				await Promise.all(
					formatData.map(function (item) {
						if (item.type == 'video') {
							recordingUrl = item.url
						}
					})
				)

				let data = {
					_id: sessionId,
					description: sessionDetails.description,
					title: sessionDetails.title,
					recordingUrl: recordingUrl,
				}
				await kafkaCommunication.pushCompletedSessionToKafka(data)

				/* 				let transformedSessionData = await sessionDTO.transformSessionData(sessionId, sessionDetails.userId)
				await kafkaCommunication.pushSessionToKafka(transformedSessionData)
				function sleep(ms) {
					return new Promise((resolve) => setTimeout(resolve, ms))
				}
				const body = {
					sessionId: sessionId,
				}
				await sleep(10000)
				const response = await axios.post(process.env.BPP_SESSION_UPDATE_URI, body, { timeout: 0 }) */
				console.log('sessionComplete.response', response)
			}

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name getRecording
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - Recording details.
	 */

	static async getRecording(sessionId) {
		try {
			const session = await sessionData.findSessionById(sessionId)
			if (!session) {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const recordingInfo = await bigBlueButton.getRecordings(sessionId)

			// let response = await requestUtil.get("https://dev.mentoring.shikshalokam.org/playback/presentation/2.3/6af6737c986d83e8d5ce2ff77af1171e397c739e-1638254682349");
			// console.log(response);

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				result: recordingInfo.data.response.recordings,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name updateRecordingUrl
	 * @param {String} internalMeetingID - Internal Meeting ID
	 * @returns {JSON} - Recording link updated.
	 */

	static async updateRecordingUrl(internalMeetingId, recordingUrl) {
		try {
			const updateStatus = await sessionData.updateOneSession(
				{
					internalMeetingId,
				},
				{
					recordingUrl,
				}
			)

			if (updateStatus === 'SESSION_NOT_FOUND') {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name updateRecordingUrl
	 * @param {String} internalMeetingID - Internal Meeting ID
	 * @returns {JSON} - Recording link updated.
	 */

	/* 	static async transformSessionData(sessionId, userId) {
		try {
			const filter = {}

			if (ObjectId.isValid(sessionId)) {
				filter._id = sessionId
			}
			let sessionDetails = await sessionData.findOneSession(filter)
			let mentorsDetails = await userProfile.details('', userId)
			const mentorFilter = ['_id', 'name', 'image', 'rating', 'gender']

			const filteredMentorDetails = Object.keys(mentorsDetails.data.result)
				.filter((key) => mentorFilter.includes(key))
				.reduce((obj, key) => {
					obj[key] = mentorsDetails.data.result[key]
					return obj
				}, {})
			sessionDetails.mentor = filteredMentorDetails

			console.log('sesssion details', sessionDetails)
			 			let res = await kafkaCommunication.pushSessionToKafka(data)
			console.log('Session data', res) 
		} catch (error) {
			throw error
		}
	} */

	/**
	 * join session.
	 * @method
	 * @name start
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @param {String} name - name of the mentee.
	 * @returns {JSON} - start session link
	 */

	static async join(sessionId, userId, name) {
		try {
			const session = await sessionData.findSessionById(sessionId)

			let message
			if (!session) {
				message = 'SESSION_NOT_FOUND'
			}

			if (session && session.status == 'completed') {
				message = 'SESSION_ENDED'
			}

			if (session && session.status !== 'live') {
				message = 'JOIN_ONLY_LIVE_SESSION'
			}
			if (message) {
				return common.successResponse({
					statusCode: httpStatusCode.temporarily_moved,
					message: message,
					result: {
						url: common.JOIN_SESSION_EJS,
					},
				})
			}
			const sessionAttendee = await sessionAttendesData.findAttendeeBySessionAndUserId(userId, sessionId)

			if (!sessionAttendee) {
				return common.successResponse({
					statusCode: httpStatusCode.temporarily_moved,
					message: 'USER_NOT_ENROLLED',
					result: {
						url: common.JOIN_SESSION_EJS,
					},
				})
			}

			const attendeeLink = await bigBlueButton.joinMeetingAsAttendee(sessionId, name, session.menteePassword)
			let link = attendeeLink

			return common.successResponse({
				statusCode: httpStatusCode.moved_Permanently,
				message: 'SESSION_LINK_GENERATED_SUCCESSFULLY',
				result: {
					url: link,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * session summary update.
	 * @method
	 * @name sessionUpdateFromKafka
	 * @param {String} sessionId - session id.
	 * @param {String} updateData - user id.
	 * @returns {JSON} - session update session
	 */

	static async sessionUpdateFromKafka(sessionId, updateData) {
		try {
			console.log('---------', updateData, '-----', sessionId)
			const updateStatus = await sessionData.updateOneSession(
				{
					_id: sessionId,
				},
				updateData
			)
			console.log('--------- updateStatus--------', updateStatus)

			if (updateStatus === 'SESSION_NOT_FOUND') {
				return common.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const session = await sessionData.findSessionById(sessionId)

			if (session && session.summary) {
				const templateData = await notificationTemplateData.findOneEmailTemplate(
					process.env.POST_SESSION_EMAIL_TEMPLATE
				)

				let userDetails = await userProfile.details('', session.userId)
				let email = userDetails.data.result.email.address

				if (templateData) {
					// Push successful unenrollment to session in kafka
					const payload = {
						type: 'email',
						email: {
							to: email,
							subject: templateData.subject,
							body: utils.composeEmailBody(templateData.body, {
								name: userDetails.data.result.name,
								sessionTitle: session.title,
								summary: session.summary,
								inviteLink: session.inviteLink,
								channalId: session.channalId,
								channelName: session.channelName,
							}),
						},
					}
					await kafkaCommunication.pushEmailToKafka(payload)

					let allAttendess = []
					let attendeesInfo = []
					const sessionAttendees = await sessionAttendesData.findAllSessionAttendees({
						sessionId: sessionId,
						isEnrolled: true,
					})
					if (sessionAttendees && sessionAttendees.length > 0) {
						sessionAttendees.forEach((attendee) => {
							allAttendess.push(attendee.userId.toString())
							attendeesInfo.push({
								userId: attendee.userId.toString(),
								title: session.title,
							})
						})
					}
					const attendeesAccounts = await sessionAttendeesHelper.getAllAccountsDetail(allAttendess)

					if (attendeesAccounts.result && attendeesAccounts.result.length > 0) {
						attendeesInfo.forEach(async function (attendee) {
							var foundElement = attendeesAccounts.result.find(
								(e) => e._id === attendee.userId.toString()
							)
							if (foundElement && foundElement.email.address && foundElement.name) {
								const payload = {
									type: 'email',
									email: {
										to: foundElement.email.address,
										subject: emailTemplate.subject,
										body: utils.composeEmailBody(templateData.body, {
											name: foundElement.name,
											sessionTitle: session.title,
											summary: session.summary,
											inviteLink: session.inviteLink,
											channalId: session.channalId,
											channelName: session.channelName,
										}),
									},
								}
								await kafkaCommunication.pushEmailToKafka(payload)
							}
						})
					}
				}
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}
}
