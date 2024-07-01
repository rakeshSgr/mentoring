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
			const rowToDelete = await RolePermissionMapping.findOne({
				where: {
					role_title: common.PUBLIC_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
				},
			})
			await rowToDelete.destroy()
		} catch (error) {
			console.error('Error deleting row:', error)
			throw error
		}
		try {
			const rolePermissionsData = [
				{
					role_title: common.MENTEE_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.MENTOR_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ADMIN_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.SESSION_MANAGER_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.USER_ROLE,
					permission_id: await getPermissionId('platform', ['GET'], '/mentoring/v1/platform/config'),
					module: 'platform',
					request_type: ['GET'],
					api_path: '/mentoring/v1/platform/config',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
			]
			await queryInterface.bulkInsert('role_permission_mapping', rolePermissionsData)
		} catch (error) {
			console.error(error)
			throw error
		}
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('role_permission_mapping', null, {})
	},
}
