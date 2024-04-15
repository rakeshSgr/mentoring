'use strict'

require('module-alias/register')
require('dotenv').config()
const common = require('@constants/common')
const Permissions = require('@database/models/index').Permission

const getPermissionId = async (module, request_type, api_path) => {
	const permission = await Permissions.findOne({
		where: { module, request_type, api_path },
	})
	if (!permission) {
		throw new Error(
			`Permission not found for module: ${module}, request_type: ${request_type}, api_path: ${api_path}`
		)
	}
	return permission.id
}

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const rolePermissionsData = [
			{
				role_title: common.ADMIN_ROLE,
				permission_id: await getPermissionId(
					'external',
					['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					'/mentoring/v1/external/*'
				),
				module: 'external',
				request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
				api_path: '/mentoring/v1/external/*',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 0,
			},
			{
				role_title: common.MENTOR_ROLE,
				permission_id: await getPermissionId(
					'external',
					['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					'/mentoring/v1/external/*'
				),
				module: 'external',
				request_type: ['POST', 'GET', 'PUT'],
				api_path: '/mentoring/v1/external/*',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 0,
			},
			{
				role_title: common.MENTEE_ROLE,
				permission_id: await getPermissionId(
					'external',
					['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					'/mentoring/v1/external/*'
				),
				module: 'external',
				request_type: ['POST', 'GET', 'PUT'],
				api_path: '/mentoring/v1/external/*',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 0,
			},
			{
				role_title: common.ORG_ADMIN_ROLE,
				permission_id: await getPermissionId(
					'external',
					['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					'/mentoring/v1/external/*'
				),
				module: 'external',
				request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
				api_path: '/mentoring/v1/external/*',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 0,
			},
			{
				role_title: common.USER_ROLE,
				permission_id: await getPermissionId(
					'external',
					['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					'/mentoring/v1/external/*'
				),
				module: 'external',
				request_type: ['POST', 'GET', 'PUT'],
				api_path: '/mentoring/v1/external/*',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 0,
			},
			{
				role_title: common.SESSION_MANAGER_ROLE,
				permission_id: await getPermissionId(
					'external',
					['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					'/mentoring/v1/external/*'
				),
				module: 'external',
				request_type: ['POST', 'GET', 'PUT'],
				api_path: '/mentoring/v1/external/*',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 0,
			},
		]

		await queryInterface.bulkInsert('role_permission_mapping', rolePermissionsData)
	},

	down: async (queryInterface, Sequelize) => {
		const roleTitles = [
			common.ADMIN_ROLE,
			common.MENTOR_ROLE,
			common.MENTEE_ROLE,
			common.ORG_ADMIN_ROLE,
			common.USER_ROLE,
			common.SESSION_MANAGER_ROLE,
		]

		await queryInterface.bulkDelete('role_permission_mapping', {
			role_title: roleTitles,
			module: 'external',
			api_path: '/mentoring/v1/external/*',
		})
	},
}
