'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const permissionsData = [
				{
					code: 'cloud_service_permissions',
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					code: 'bulk_sessions_permissions',
					module: 'sessions',
					request_type: ['POST'],
					api_path: '/mentoring/v1/sessions/bulkSessionCreate',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					code: 'get_sample_csv_permission',
					module: 'sessions',
					request_type: ['GET'],
					api_path: '/mentoring/v1/sessions/getSampleCSV',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					code: 'upload_sample_csv_permission',
					module: 'org-admin',
					request_type: ['POST'],
					api_path: '/mentoring/v1/org-admin/uploadCustomCSV',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
			]
			await queryInterface.bulkInsert('permissions', permissionsData)
		} catch (error) {
			console.log(error)
		}
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('permissions', null, {})
	},
}
