'use strict'

require('module-alias/register')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const request = require('request')
const common = require('@constants/common')
const fileService = require('@services/files')

async function uploadFile(filePath, uploadFilePath) {
	try {
		// Check if the file exists
		if (!fs.existsSync(filePath)) {
			throw new Error('The file does not exist in the folder: ' + filePath)
		}

		const uploadFolder = path.dirname(uploadFilePath)
		const uploadFileName = path.basename(uploadFilePath)

		// Get signed URL for uploading
		const signedUrlResult = await fileService.getSignedUrl(uploadFileName, '', uploadFolder, true)

		if (!signedUrlResult.result) {
			throw new Error('FAILED_TO_GENERATE_SIGNED_URL')
		}

		const fileUploadUrl = signedUrlResult.result.signedUrl
		const fileData = fs.readFileSync(filePath)

		// Upload file
		await request({
			url: fileUploadUrl,
			method: 'PUT',
			headers: {
				'x-ms-blob-type': common.azureBlobType,
				'Content-Type': 'multipart/form-data',
			},
			body: fileData,
		})

		console.log('File uploaded successfully')
		console.log('File path: ' + signedUrlResult.result.filePath)

		// Get downloadable URL
		const downloadableURL = await fileService.getDownloadableUrl(uploadFilePath, true)
		return downloadableURL.result
	} catch (error) {
		console.error('Error uploading file:', error)
		throw error
	}
}

module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const defaultOrgId = queryInterface.sequelize.options.defaultOrgId

			if (!defaultOrgId) {
				throw new Error('Default org ID is undefined. Please make sure it is set in sequelize options.')
			}

			// Path to the file to be uploaded
			const fileName = 'emailLogo.png'
			const filePath = path.join(__dirname, '../../assets', fileName)
			const uploadFilePath = 'assets/emailLogo.png'

			// Upload file
			const logoURL = await uploadFile(filePath, uploadFilePath)

			// Your email template data
			const emailTemplates = [
				{
					body: "{{default}}<div><p>Dear {name},</p> The live session scheduled by you - {sessionTitle} begins in 1 hour. Please ensure that you join at least 10 minutes before for the set time to allow Mentees to settle in.</div>{{/default}}{{linkWarning}}<div><p>Please add a meeting link for your scheduled session that starts in less than 1 hour. To add a meeting link, click on the 'edit session' option on the session details page of MentorED.</div></p>{{/linkWarning}}",
					code: 'mentor_one_hour_before_session_reminder',
					subject: 'MentorED - Your scheduled session starts in 1 hour',
				},
				{
					body:
						"<div style='margin:auto;width:100%;max-width:650px;'><p style='text-align:center'><img class='img_path' style='width:200px; max-width:100%; height:auto;' alt='MentorED' src='" +
						logoURL +
						"'></p><div style='text-align:left;'>",
					code: 'email_header',
					subject: '',
				},
				{
					body: "</div><div style='margin-top:20px;text-align:left;'><div>Regards,</div><div>Team MentorED</div><div style='margin-top:20px;color:#b13e33;text-align:left'><div>Note: Do not reply to this email. This email is sent from an unattended mailbox. Replies will not be read.</div><div>For any queries, please feel free to reach out to us at support@shikshalokam.org</div></div></div></div>",
					code: 'email_footer',
					subject: '',
				},
				{
					body: '<p>Dear {name},</p> The live session you have enrolled in {sessionTitle} begins in 15 minutes. Please ensure that you join at least 5 minutes before for the session to begin on time.',
					code: 'mentee_session_reminder',
					subject: 'MentorED - Your enrolled session starts in 15 minutes',
				},
				{
					body: "{{default}}<p>Dear {name},</p> The live session scheduled by you - {sessionTitle} is scheduled in 24 hours from now. Please ensure that you join at least ten minutes before the set time to allow Mentees to settle in.{{/default}}{{linkWarning}}<div><p>Please add a meeting link for your scheduled session that starts in less than 24 hours. To add a meeting link, click on the 'edit session' option on the session details page of MentorED.</div></p>{{/linkWarning}}",
					code: 'mentor_session_reminder',
					subject: 'MentorED - Your scheduled session starts in 24 hours',
				},
				{
					body: '<p>Dear {name},</p> Please note that the Mentor has cancelled the session - {sessionTitle}.',
					code: 'mentor_session_delete',
					subject: 'MentorED - Changes updated in your session',
				},
				{
					body: '<p>Dear {name},</p> Please note that the Mentor has rescheduled the session - {sessionTitle} from {oldStartDate} {oldStartTime} - {oldEndDate} {oldEndTime} to {newStartDate} {newStartTime} - {newEndDate} {newEndTime} Please make note of the changes.',
					code: 'mentor_session_reschedule',
					subject: 'MentorED - Changes in your enrolled session',
				},
				{
					body: "<div><p>Dear {name}, </p> You have cancelled your enrollment for the session - {sessionTitle} by {mentorName} Please explore 'All sessions' on your app to enroll for new sessions of your choice.</div>",
					code: 'mentee_session_cancel',
					subject: 'MentorED - Changes in your enrolled session',
				},
				{
					body: "<p>Dear {name},</p> Thank you for enrolling for the session - <strong> {sessionTitle} </strong> by <strong> {mentorName} </strong>, The session is scheduled on <strong>{startDate}</strong> at <strong>{startTime}</strong> You will be able to join from  'Enrolled sessions'  tab once the Mentor starts the meeting.",
					code: 'mentee_session_enrollment',
					subject: 'MentorED - Session Enrollment Details',
				},
				{
					body: '<div><p>Hi Team,</p><p>{role} {name}, is facing an issue in <b>{description}</b> -{userEmailId},User ID: <b>{userId}</b> .</p><p>Kindly look into it.</p><div style="background-color: #f5f5f5; padding: 10px; margin-top: 10px;"><p><b>Meta Information:</b></p><ul style="list-style-type: none; padding: 0;">{metaItems}</ul></div></div>',
					code: 'user_issue_reported',
					subject: 'Support request for MentorED',
				},
				{
					body: '<div><p>Dear {name},</p><p>I hope this email finds you well. We are excited to inform you that a mentoring session has been scheduled, and you have been invited as the mentee for this session.</p><p><strong>Session Details:</strong></p><ul><li><strong>Date:</strong> {startDate}</li><li><strong>Time:</strong> {startTime}</li><li><strong>Duration:</strong> {sessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {sessionPlatform}</li><li><strong>Topic:</strong> {sessionTitle}</li></ul><p>Make sure to prepare any necessary materials or information for the session. If there are any issues or conflicts with the schedule, please let us know at your earliest convenience so that we can make any necessary adjustments.</p></div>',
					code: 'mentee_session_enrollment_by_manager',
					subject: 'Invited Session Scheduled',
				},
				{
					body: '<div><p>Dear {name},</p><p>I hope this email finds you well. We are excited to inform you that a mentoring session has been scheduled, and you have been assigned as the mentor for this session.</p><p><strong>Session Details:</strong></p><ul><li><strong>Date:</strong> {startDate}</li><li><strong>Time:</strong> {startTime}</li><li><strong>Duration:</strong> {sessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {sessionPlatform}</li><li><strong>Topic:</strong> {sessionTitle}</li><li><strong>Session Type:</strong> {sessionType}</li></ul><p>Please take note that this is a private session and {noOfMentees} mentees are added to the session. Make sure to prepare any necessary materials or information for the session. If there are any issues or conflicts with the assigned schedule, please let us know at your earliest convenience so that we can make any necessary adjustments. Thank you for your commitment to mentoring. Your guidance and expertise are highly valued, and we appreciate your dedication to supporting the growth and development of our mentees.</p></div>',
					code: 'mentor_invite_private_session_by_manager',
					subject: 'Private Session Scheduled',
				},
				{
					body: '<div><p>Dear {name},</p><p>I hope this email finds you well. We are excited to inform you that a mentoring session has been scheduled, and you have been assigned as the mentor for this session.</p><p><strong>Session Details:</strong></p><ul><li><strong>Date:</strong> {startDate}</li><li><strong>Time:</strong> {startTime}</li><li><strong>Duration:</strong> {sessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {sessionPlatform}</li><li><strong>Topic:</strong> {sessionTitle}</li><li><strong>Session Type:</strong> {sessionType}</li></ul><p>Please take note that this is a public session and mentees will be able to enroll in the session. Make sure to prepare any necessary materials or information for the session. If there are any issues or conflicts with the assigned schedule, please let us know at your earliest convenience so that we can make any necessary adjustments.Thank you for your commitment to mentoring. Your guidance and expertise are highly valued, and we appreciate your dedication to supporting the growth and development of our mentees.</p></div>',
					code: 'mentor_invite_public_session_by_manager',
					subject: 'Public Session Scheduled',
				},
				{
					body: '<div><p>Dear {name},</p><p>I hope this message finds you well. I regret to inform you that the previously scheduled mentoring session has been cancelled. Please find the details below:</p><p><strong>Cancelled Session Details:</strong></p><ul><li><strong>Date:</strong> {startDate}</li><li><strong>Time:</strong> {startTime}</li><li><strong>Duration:</strong> {sessionDuration} {unitOfTime}</li><li><strong>Topic:</strong> {sessionTitle}</li></ul><p>We understand that your time is valuable, and we sincerely apologize for any inconvenience this may cause. Thank you for your continued commitment to the mentoring program. Your dedication is instrumental in creating a positive and supportive mentoring experience.</p></div>',
					code: 'session_deleted_by_manager',
					subject: 'Update: Cancellation of Scheduled Mentoring Session',
				},
				{
					body: '<div><p>Dear {name},</p><p>I trust this email finds you well. I wanted to inform you that there have been some updates to the mentoring session previously scheduled. Please review the changes outlined below:</p><p><strong>Original Session Details:</strong></p><ul><li><strong>Date:</strong> {startDate}</li><li><strong>Time:</strong> {startTime}</li><li><strong>Duration:</strong> {sessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {sessionPlatform}</li><li><strong>Topic:</strong> {originalSessionTitle}</li><li><strong>Session Type:</strong> {sessionType}</li></ul><p><strong>Revised Session Details:</strong></p><ul><li><strong>Date:</strong> {newStartDate}</li><li><strong>Time:</strong> {newStartTime}</li><li><strong>Duration:</strong> {newSessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {newSessionPlatform}</li><li><strong>Topic:</strong> {revisedSessionTitle}</li><li><strong>Session Type:</strong> {newSessionType}</li></ul><p>We understand that schedule changes may impact your availability, and we appreciate your flexibility. If you have any concerns or conflicts with the revised schedule, please let us know as soon as possible so that we can address them accordingly. Thank you for your understanding and continued commitment to mentoring. Your guidance plays a crucial role in the success of our mentoring program, and we value your contributions.</p></div>',
					code: 'mentor_session_edited_by_manager_email_template',
					subject: 'Changes to Scheduled Mentoring Session',
				},
				{
					body: '<div><p>Dear {name},</p><p>I trust this email finds you well. I wanted to inform you that there have been some updates to the mentoring session previously scheduled in which you were enrolled. Please review the changes outlined below:</p><p><strong>Original Session Details:</strong></p><ul><li><strong>Date:</strong> {startDate}</li><li><strong>Time:</strong> {startTime}</li><li><strong>Duration:</strong> {sessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {sessionPlatform}</li><li><strong>Topic:</strong> {originalSessionTitle}</li><li><strong>Session Type:</strong> {sessionType}</li></ul><p><strong>Revised Session Details:</strong></p><ul><li><strong>Date:</strong> {newStartDate}</li><li><strong>Time:</strong> {newStartTime}</li><li><strong>Duration:</strong> {newSessionDuration} {unitOfTime}</li><li><strong>Session Platform:</strong> {newSessionPlatform}</li><li><strong>Topic:</strong> {revisedSessionTitle}</li><li><strong>Session Type:</strong> {newSessionType}</li></ul><p>We understand that schedule changes may impact your availability, and we appreciate your flexibility. If there are any concerns or conflicts with the revised schedule, please let us know as soon as possible so that we can address them accordingly. Thank you for your understanding and continued participation in the mentoring program. Your engagement contributes significantly to the success of our mentoring initiatives, and we value your ongoing support.</p></div>',
					code: 'mentee_session_edited_by_manager_email_template',
					subject: 'Changes to Scheduled Mentoring Session',
				},
			]
			// Check if email templates exist
			const existingTemplates = await queryInterface.sequelize.query(
				'SELECT code FROM notification_templates WHERE organization_id = :orgId',
				{
					replacements: { orgId: defaultOrgId },
					type: Sequelize.QueryTypes.SELECT,
				}
			)

			const newTemplates = emailTemplates.filter((template) => {
				return !existingTemplates.some((existingTemplate) => existingTemplate.code === template.code)
			})

			// Insert new email templates
			const notificationTemplateData = newTemplates.map((emailTemplate) => {
				emailTemplate['status'] = 'ACTIVE'
				emailTemplate['type'] = 'email'
				emailTemplate['updated_at'] = moment().format()
				emailTemplate['created_at'] = moment().format()
				emailTemplate['organization_id'] = defaultOrgId
				if (emailTemplate.code == 'email_footer') {
					emailTemplate['type'] = 'emailFooter'
				} else if (emailTemplate.code == 'email_header') {
					emailTemplate['type'] = 'emailHeader'
				} else {
					emailTemplate['email_footer'] = 'email_footer'
					emailTemplate['email_header'] = 'email_header'
				}
				return emailTemplate
			})
			if (notificationTemplateData.length != 0) {
				await queryInterface.bulkInsert('notification_templates', notificationTemplateData, {})
			}
		} catch (error) {
			console.log('Error:', error)
		}
	},

	down: async (queryInterface, Sequelize) => {
		const defaultOrgId = queryInterface.sequelize.options.defaultOrgId

		await queryInterface.bulkDelete('notification_templates', { organization_id: defaultOrgId }, {})
	},
}
