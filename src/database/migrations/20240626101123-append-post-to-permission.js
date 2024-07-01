'use strict'
require('module-alias/register')
require('dotenv').config()

const { Permission } = require('@database/models/index')

const appendRequestType = (currentRequestType, newType) => {
	if (!currentRequestType.includes(newType)) {
		currentRequestType.push(newType)
	}
	return currentRequestType
}

module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const permission = await Permission.findOne({
				where: {
					code: 'users_permissions',
					module: 'users',
					api_path: '/mentoring/v1/users/*',
				},
			})

			if (permission) {
				const updatedRequestType = appendRequestType(permission.request_type, 'POST')
				await Permission.update({ request_type: updatedRequestType }, { where: { id: permission.id } })
			}
		} catch (error) {
			console.error(error)
			throw error
		}
	},

	down: async (queryInterface, Sequelize) => {
		try {
			const permission = await Permission.findOne({
				where: {
					code: 'users_permissions',
					module: 'users',
					api_path: '/mentoring/v1/users/*',
				},
			})

			if (permission) {
				const updatedRequestType = permission.request_type.filter((type) => type !== 'POST')
				await Permission.update({ request_type: updatedRequestType }, { where: { id: permission.id } })
			}
		} catch (error) {
			console.error(error)
			throw error
		}
	},
}
