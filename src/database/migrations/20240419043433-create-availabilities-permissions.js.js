'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const permissionsData = [
				{
					code: 'write_availability',
					module: 'availability',
					request_type: ['GET', 'POST', 'PATCH', 'DELETE'],
					api_path: '/mentoring/v1/availability/*',
					status: 'ACTIVE',
				},
				{
					code: 'get_availability',
					module: 'availability',
					request_type: ['GET'],
					api_path: '/mentoring/v1/availability/read*',
					status: 'ACTIVE',
				},
				{
					code: 'is_available',
					module: 'availability',
					request_type: ['GET'],
					api_path: '/mentoring/v1/availability/isAvailable*',
					status: 'ACTIVE',
				},
				{
					code: 'users_available',
					module: 'availability',
					request_type: ['GET'],
					api_path: '/mentoring/v1/availability/users',
					status: 'ACTIVE',
				},
			]

			// Batch insert permissions
			await queryInterface.bulkInsert(
				'permissions',
				permissionsData.map((permission) => ({
					...permission,
					created_at: new Date(),
					updated_at: new Date(),
				}))
			)
		} catch (error) {
			console.error('Error in migration:', error)
			throw error
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			// Rollback migration by deleting all permissions
			await queryInterface.bulkDelete('permissions', null, {})
		} catch (error) {
			console.error('Error in rollback migration:', error)
			throw error
		}
	},
}
