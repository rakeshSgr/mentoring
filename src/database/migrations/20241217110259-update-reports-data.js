'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const defaultOrgId = queryInterface.sequelize.options.defaultOrgId

		if (!defaultOrgId) {
			throw new Error('Default org ID is undefined. Please make sure it is set in sequelize options.')
		}
		// Insert the report data into the reports table
		await queryInterface.bulkInsert('reports', [
			{
				code: 'total_number_of_sessions_attended',
				title: 'Total number of sessions attended',
				description: 'Total sessions attended by user in big number',
				report_type_title: 'big_number',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'total_hours_of_learning',
				title: 'Total hours of learning',
				description: 'Total hours of learning by user in big number',
				report_type_title: 'big_number',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'split_of_sessions_enrolled_and_attended_by_user',
				title: 'Total sessions enrolled vs total sessions attended',
				description: 'Split of sessions enrolled and attended by user in bar chart',
				report_type_title: 'bar_chart',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'mentee_session_details',
				title: 'Session details',
				description: 'Mentee session details table with pagination and downloadable pdf',
				report_type_title: 'table',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: JSON.stringify({
					columns: [
						{
							key: 'sessions_title',
							label: 'Sessions Title',
							filter: false,
							sort: false,
						},
						{
							key: 'sessions_created_by',
							label: 'Sessions Created By',
							filter: true,
							sort: true,
						},
						{
							key: 'mentor_name',
							label: 'Mentor Name',
							filter: true,
							sort: true,
						},
						{
							key: 'date_of_session',
							label: 'Date of Session',
							filter: true,
							sort: true,
						},
						{
							key: 'session_type',
							label: 'Session Type',
							filter: true,
							sort: true,
						},
						{
							key: 'categories',
							label: 'Categories',
							filter: true,
							sort: true,
						},
						{
							key: 'recommended_for',
							label: 'Recommended for',
							filter: true,
							sort: true,
						},
						{
							key: 'session_attended',
							label: 'Session Attended',
							filter: true,
							sort: true,
						},
						{
							key: 'duration_of_sessions_attended_in_minutes',
							label: 'Duration of Sessions Attended - min (at setup time)',
							filter: true,
							sort: true,
						},
					],
				}),
				organization_id: defaultOrgId,
			},
			{
				code: 'total_number_of_sessions_conducted',
				title: 'Total number of sessions attended',
				description: 'Total number of sessions conducted by user in big number',
				report_type_title: 'big_number',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'total_hours_of_mentoring_conducted',
				title: 'Total hours of Mentoring conducted',
				description: 'Total number of mentoring hours conducted by user in big number',
				report_type_title: 'big_number',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'split_of_sessions_conducted',
				title: 'Number of sessions created or assigned vs number of sessions conducted',
				description: 'Split of sessions created by user with number of sessions conducted by user in bar chart',
				report_type_title: 'bar_chart',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'mentoring_session_details',
				title: 'Mentoring Session Details',
				description: 'Mentoring session details table with pagination and downloadable pdf',
				report_type_title: 'table',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: JSON.stringify({
					columns: [
						{
							key: 'sessions_created_by',
							label: 'Sessions Created By',
							filter: true,
							sort: true,
						},
						{
							key: 'sessions_title',
							label: 'Sessions Title',
							filter: false,
							sort: false,
						},
						{
							key: 'date_of_session',
							label: 'Date of Session',
							filter: true,
							sort: true,
						},
						{
							key: 'session_type',
							label: 'Session Type',
							filter: true,
							sort: true,
						},
						{
							key: 'number_of_mentees',
							label: 'Number of Mentees',
							filter: true,
							sort: true,
						},
						{
							key: 'session_conducted',
							label: 'Session Conducted',
							filter: true,
							sort: true,
						},
						{
							key: 'duration_of_sessions_attended_in_minutes',
							label: 'Duration of Sessions Attended - min (at setup time)',
							filter: true,
							sort: true,
						},
						{
							key: 'session_rating',
							label: 'Session Rating',
							filter: false,
							sort: false,
						},
						{
							key: 'mentor_rating',
							label: 'Mentor Rating',
							filter: true,
							sort: true,
						},
					],
				}),
				organization_id: defaultOrgId,
			},
			{
				code: 'total_hours_of_sessions_created_by_session_manager',
				title: 'Total hours of sessions created by SM',
				description: 'Total hours of sessions created by Session Manager in big number',
				report_type_title: 'big_number',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'total_number_of_hours_of_mentoring_conducted',
				title: 'Total hours of mentoring conducted',
				description: 'Total sessions created by Session Manager in big number',
				report_type_title: 'big_number',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'split_of_sessions_created_and_conducted',
				title: 'Total number of sessions created vs Total number of sessions conducted',
				description:
					'Total number of sessions created by session manager vs Total number of sessions conducted by session manager',
				report_type_title: 'table',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: '{}',
				organization_id: defaultOrgId,
			},
			{
				code: 'session_manger_session_details',
				title: 'Session details',
				description:
					'Number and hours of Mentoring Sessions conducted by individual Mentors along with Mentor Rating',
				report_type_title: 'table',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				config: JSON.stringify({
					columns: [
						{
							key: 'mentor_name',
							label: 'Mentor Name',
							filter: false,
							sort: false,
						},
						{
							key: 'number_of_mentoring_sessions',
							label: 'Number of Mentoring Sessions',
							filter: false,
							sort: true,
						},
						{
							key: 'hours_of_mentoring_sessions',
							label: 'Hours of Mentoring Sessions',
							filter: false,
							sort: true,
						},
						{
							key: 'avg_mentor_rating',
							label: 'Avg Mentor Rating',
							filter: false,
							sort: true,
						},
						{
							key: 'avg_session_rating',
							label: 'Avg Session Rating',
							filter: false,
							sort: true,
						},
					],
				}),
				organization_id: defaultOrgId,
			},
		])
	},

	async down(queryInterface, Sequelize) {
		// Revert the inserted data
		await queryInterface.bulkDelete('reports', {
			code: [
				'total_number_of_sessions_attended',
				'total_hours_of_learning',
				'split_of_sessions_enrolled_and_attended_by_user',
				'mentee_session_details',
				'total_number_of_sessions_conducted',
				'total_hours_of_mentoring_conducted',
				'split_of_sessions_conducted',
				'mentoring_session_details',
				'total_hours_of_sessions_created_by_session_manager',
				'total_number_of_hours_of_mentoring_conducted',
				'split_of_sessions_created_and_conducted',
				'session_manger_session_details',
			],
		})
	},
}
