'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const permissionsData = [
				{
					code: 'default-rule_permissions',
					module: 'default-rule',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/default-rule/*',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					code: 'default-rule_read_permissions',
					module: 'default-rule',
					request_type: ['GET'],
					api_path: '/mentoring/v1/default-rule/read*',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					code: 'default-rule_update_permissions',
					module: 'default-rule',
					request_type: ['PATCH'],
					api_path: '/mentoring/v1/default-rule/update*',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					code: 'default-rule_delete_permissions',
					module: 'default-rule',
					request_type: ['DELETE'],
					api_path: '/mentoring/v1/default-rule/delete*',
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
