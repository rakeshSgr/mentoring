'use strict'

require('module-alias/register')
const userRequests = require('@requests/user')
require('dotenv').config()
const common = require('@constants/common')
const Permissions = require('@database/models/index').Permission

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

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const rolePermissionsData = [
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId(
						'default-rule',
						['POST', 'GET'],
						'/mentoring/v1/default-rule/*'
					),
					module: 'default-rule',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/default-rule/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId(
						'default-rule',
						['PATCH'],
						'/mentoring/v1/default-rule/update*'
					),
					module: 'default-rule',
					request_type: ['PATCH'],
					api_path: '/mentoring/v1/default-rule/update*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId(
						'default-rule',
						['DELETE'],
						'/mentoring/v1/default-rule/delete*'
					),
					module: 'default-rule',
					request_type: ['DELETE'],
					api_path: '/mentoring/v1/default-rule/delete*',
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
