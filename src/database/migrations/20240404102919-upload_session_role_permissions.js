'use strict'

require('module-alias/register')
const userRequests = require('@requests/user')
require('dotenv').config()
const common = require('@constants/common')
const Permissions = require('@database/models/index').Permission
const RolePermissionMapping = require('@database/models/index').RolePermission

const getPermissionId = async (module, request_type, api_path) => {
	try {
		const permission = await Permissions.findOne({
			where: { module, request_type, api_path },
		})
		if (!permission) {
			throw error
		}
		return permission.id
	} catch (error) {
		throw error
	}
}
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const rolePermissionsData = [
				{
					role_title: common.MENTEE_ROLE,
					permission_id: await getPermissionId(
						'cloud-services',
						['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
						'/mentoring/v1/cloud-services/*'
					),
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.MENTOR_ROLE,
					permission_id: await getPermissionId(
						'cloud-services',
						['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
						'/mentoring/v1/cloud-services/*'
					),
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId(
						'cloud-services',
						['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
						'/mentoring/v1/cloud-services/*'
					),
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ADMIN_ROLE,
					permission_id: await getPermissionId(
						'cloud-services',
						['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
						'/mentoring/v1/cloud-services/*'
					),
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.SESSION_MANAGER_ROLE,
					permission_id: await getPermissionId(
						'cloud-services',
						['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
						'/mentoring/v1/cloud-services/*'
					),
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.USER_ROLE,
					permission_id: await getPermissionId(
						'cloud-services',
						['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
						'/mentoring/v1/cloud-services/*'
					),
					module: 'cloud-services',
					request_type: ['POST', 'DELETE', 'GET', 'PUT', 'PATCH'],
					api_path: '/mentoring/v1/cloud-services/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.SESSION_MANAGER_ROLE,
					permission_id: await getPermissionId(
						'sessions',
						['POST'],
						'/mentoring/v1/sessions/bulkSessionCreate'
					),
					module: 'sessions',
					request_type: ['POST'],
					api_path: '/mentoring/v1/sessions/bulkSessionCreate',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.SESSION_MANAGER_ROLE,
					permission_id: await getPermissionId('sessions', ['GET'], '/mentoring/v1/sessions/getSampleCSV'),
					module: 'sessions',
					request_type: ['GET'],
					api_path: '/mentoring/v1/sessions/getSampleCSV',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId(
						'org-admin',
						['POST'],
						'/mentoring/v1/org-admin/uploadCustomCSV'
					),
					module: 'org-admin',
					request_type: ['POST'],
					api_path: '/mentoring/v1/org-admin/uploadCustomCSV',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
			]
			await queryInterface.bulkInsert('role_permission_mapping', rolePermissionsData)
		} catch (error) {
			console.error(error)
		}
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('role_permission_mapping', null, {})
	},
}
