const DefaultRule = require('@database/models/index').DefaultRule
const { Op } = require('sequelize')

/**
 * Creates a new DefaultRule record.
 * @param {Object} data - The data to create the DefaultRule with.
 * @returns {Promise<Object|Error>} The created DefaultRule or an error.
 */
exports.create = async (data) => {
	try {
		return await DefaultRule.create(data)
	} catch (error) {
		console.error('Error creating DefaultRule:', error)
		return error
	}
}

/**
 * Finds a single DefaultRule record based on the filter.
 * @param {Object} filter - The filter to find the DefaultRule.
 * @param {Object} [options={}] - Additional query options.
 * @returns {Promise<Object|Error>} The found DefaultRule or an error.
 */
exports.findOne = async (filter, options = {}) => {
	try {
		const res = await DefaultRule.findOne({
			where: filter,
			...options,
			raw: true,
		})
		return res
	} catch (error) {
		console.error('Error finding DefaultRule:', error)
		return error
	}
}

/**
 * Updates a DefaultRule record based on the filter and update data.
 * @param {Object} filter - The filter to find the DefaultRule.
 * @param {Object} update - The data to update the DefaultRule with.
 * @param {Object} [options={}] - Additional query options.
 * @returns {Promise<[number, number]|Error>} The number of affected rows and rows affected or an error.
 */
exports.updateOne = async (filter, update, options = {}) => {
	try {
		return await DefaultRule.update(update, {
			where: filter,
			...options,
			individualHooks: true,
		})
	} catch (error) {
		console.error('Error updating DefaultRule:', error)
		return error
	}
}

/**
 * Deletes a DefaultRule record based on the filter.
 * @param {Object} filter - The filter to find the DefaultRule.
 * @returns {Promise<number|Error>} The number of affected rows or an error.
 */
exports.deleteOne = async (filter) => {
	try {
		const result = await DefaultRule.destroy({
			where: filter,
		})
		return result
	} catch (error) {
		console.error('Error deleting DefaultRule:', error)
		return error
	}
}

/**
 * Finds all DefaultRule records that match the filter.
 * @param {Object} filter - The filter to find the DefaultRules.
 * @param {Object} [options={}] - Additional query options.
 * @returns {Promise<Array<Object>|Error>} The found DefaultRules or an error.
 */
exports.findAll = async (filter, options = {}) => {
	try {
		return await DefaultRule.findAll({
			where: filter,
			...options,
			raw: true,
		})
	} catch (error) {
		console.error('Error finding DefaultRules:', error)
		return error
	}
}

/**
 * Counts the number of DefaultRule records that match the filter.
 * @param {Object} filter - The filter to count the DefaultRules.
 * @returns {Promise<number|Error>} The count of DefaultRules or an error.
 */
exports.countRules = async (filter) => {
	try {
		return await DefaultRule.count({
			where: filter,
		})
	} catch (error) {
		console.error('Error counting DefaultRules:', error)
		return error
	}
}

/**
 * Finds DefaultRule records created within a specific date range.
 * @param {Date} startDate - The start date of the range.
 * @param {Date} endDate - The end date of the range.
 * @returns {Promise<Array<Object>|Error>} The found DefaultRules or an error.
 */
exports.findRulesInDateRange = async (startDate, endDate) => {
	try {
		return await DefaultRule.findAll({
			where: {
				created_at: {
					[Op.between]: [startDate, endDate],
				},
			},
			raw: true,
		})
	} catch (error) {
		console.error('Error finding DefaultRules in date range:', error)
		return error
	}
}
