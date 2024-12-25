const ReportType = require('@database/models/index').ReportType

module.exports = class ReportTypeQueries {
	static async createReportType(data) {
		try {
			return await ReportType.create(data, { returning: true })
		} catch (error) {
			throw error
		}
	}

	static async findReportTypeById(id) {
		try {
			return await ReportType.findByPk(id)
		} catch (error) {
			throw error
		}
	}

	static async findAllReportTypes(filter, attributes, options = {}) {
		try {
			const reportTypes = await ReportType.findAndCountAll({
				where: filter,
				attributes,
				...options,
			})
			return reportTypes
		} catch (error) {
			throw error
		}
	}

	static async updateReportType(filter, updateData) {
		try {
			const [rowsUpdated, [updatedReportType]] = await ReportType.update(updateData, {
				where: filter,
				returning: true,
			})
			return updatedReportType
		} catch (error) {
			throw error
		}
	}

	static async DeleteReportType(id) {
		try {
			const deletedRows = await ReportType.destroy({
				where: { id },
			})
			return deletedRows // Soft delete (paranoid enabled)
		} catch (error) {
			throw error
		}
	}
}
