const Report = require('@database/models/index').Report

module.exports = class ReportQueries {
	static async createReport(data) {
		try {
			return await Report.create(data, { returning: true })
		} catch (error) {
			throw error
		}
	}

	static async findReportById(id) {
		try {
			return await Report.findByPk(id)
		} catch (error) {
			throw error
		}
	}

	static async findAllReports(filter, attributes, options = {}) {
		try {
			const reports = await Report.findAndCountAll({
				where: filter,
				attributes,
				...options,
			})
			return reports
		} catch (error) {
			throw error
		}
	}

	static async updateReport(filter, updateData) {
		try {
			const [rowsUpdated, [updatedReport]] = await Report.update(updateData, {
				where: filter,
				returning: true,
			})
			return updatedReport
		} catch (error) {
			throw error
		}
	}

	static async deleteReportById(id) {
		try {
			const deletedRows = await Report.destroy({
				where: { id },
			})
			return deletedRows
		} catch (error) {
			throw error
		}
	}

	static async findReportByCode(code) {
		try {
			return await Report.findOne({
				where: { code: code },
			})
		} catch (error) {
			throw error
		}
	}
}
