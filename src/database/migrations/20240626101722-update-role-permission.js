'use strict'

require('module-alias/register')
require('dotenv').config()
const common = require('@constants/common')
const { Permission, RolePermission } = require('@database/models/index')

const getPermissionId = async (module, request_type, api_path) => {
	try {
		const permission = await Permission.findOne({
			where: { module, request_type, api_path },
			raw: true,
		})
		if (!permission) throw new Error('Permission not found')
		return permission.id
	} catch (error) {
		console.log(error)
		throw error
	}
}

const appendRequestType = (currentRequestType, newType) => {
	if (!currentRequestType.includes(newType)) {
		currentRequestType.push(newType)
	}
	return currentRequestType
}

module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const permissionId = await getPermissionId('users', ['GET', 'POST'], '/mentoring/v1/users/*')

			if (!permissionId) throw 'PERMISSION NOT FOUND'

			const mentorRolePermission = await RolePermission.findOne({
				where: { role_title: common.MENTOR_ROLE, permission_id: permissionId },
			})

			const menteeRolePermission = await RolePermission.findOne({
				where: { role_title: common.MENTEE_ROLE, permission_id: permissionId },
			})

			if (mentorRolePermission) {
				const updatedRequestType = appendRequestType(mentorRolePermission.request_type, 'POST')
				await RolePermission.update(
					{ request_type: updatedRequestType },
					{ where: { role_title: common.MENTOR_ROLE, permission_id: permissionId } }
				)
			}

			if (menteeRolePermission) {
				const updatedRequestType = appendRequestType(menteeRolePermission.request_type, 'POST')
				await RolePermission.update(
					{ request_type: updatedRequestType },
					{ where: { role_title: common.MENTEE_ROLE, permission_id: permissionId } }
				)
			}
		} catch (error) {
			console.error(error)
			throw error
		}
	},

	down: async (queryInterface, Sequelize) => {
		try {
			const permissionId = await getPermissionId('users', ['GET', 'POST'], '/mentoring/v1/users/*')

			if (!permissionId) throw 'PERMISSION NOT FOUND'

			const mentorRolePermission = await RolePermission.findOne({
				where: { role_title: common.MENTOR_ROLE, permission_id: permissionId },
			})

			const menteeRolePermission = await RolePermission.findOne({
				where: { role_title: common.MENTEE_ROLE, permission_id: permissionId },
			})

			if (mentorRolePermission) {
				const updatedRequestType = mentorRolePermission.request_type.filter((type) => type !== 'POST')
				await RolePermission.update(
					{ request_type: updatedRequestType },
					{ where: { role_title: common.MENTOR_ROLE, permission_id: permissionId } }
				)
			}

			if (menteeRolePermission) {
				const updatedRequestType = menteeRolePermission.request_type.filter((type) => type !== 'POST')
				await RolePermission.update(
					{ request_type: updatedRequestType },
					{ where: { role_title: common.MENTEE_ROLE, permission_id: permissionId } }
				)
			}
		} catch (error) {
			console.error(error)
			throw error
		}
	},
}
