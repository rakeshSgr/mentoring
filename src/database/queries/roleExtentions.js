const RoleExtension = require('@database/models/index').RoleExtension

module.exports = class RoleExtensionService {
	static async createRoleExtension(data) {
		try {
			return await RoleExtension.create(data, { returning: true })
		} catch (error) {
			throw error
		}
	}

	static async findRoleExtensionByTitle(title) {
		try {
			return await RoleExtension.findOne({
				where: { title },
			})
		} catch (error) {
			throw error
		}
	}

	static async findAllRoleExtensions(filter = {}, attributes = null, options = {}) {
		try {
			return await RoleExtension.findAndCountAll({
				where: filter,
				attributes,
				...options,
			})
		} catch (error) {
			throw error
		}
	}

	static async updateRoleExtension(title, updateData) {
		try {
			const [rowsUpdated, [updatedRoleExtension]] = await RoleExtension.update(updateData, {
				where: { title },
				returning: true,
			})
			return updatedRoleExtension
		} catch (error) {
			throw error
		}
	}

	static async softDeleteRoleExtension(title) {
		try {
			const deletedRows = await RoleExtension.destroy({
				where: { title },
			})
			return deletedRows // Soft delete (paranoid enabled)
		} catch (error) {
			throw error
		}
	}

	static async restoreRoleExtension(title) {
		try {
			const restoredRows = await RoleExtension.restore({
				where: { title },
			})
			return restoredRows // Restore soft-deleted entry
		} catch (error) {
			throw error
		}
	}
}
