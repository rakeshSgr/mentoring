'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const newPermission = {
			code: 'external_permissions',
			module: 'external',
			request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
			api_path: '/mentoring/v1/external/*',
			status: 'ACTIVE',
			created_at: new Date(),
			updated_at: new Date(),
		}
		await queryInterface.bulkInsert('permissions', [newPermission])
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('permissions', { code: 'external_permissions' }, {})
	},
}
