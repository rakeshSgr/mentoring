const defaultRuleService = require('@services/default-rule')

/**
 * Class representing Default Rule operations.
 */
module.exports = class DefaultRule {
	/**
	 * Creates an entity.
	 * @method
	 * @name create
	 * @param {Object} req - The request object.
	 * @param {Object} req.body - The request payload.
	 * @param {Object} req.decodedToken - The decoded JWT token.
	 * @param {string} req.decodedToken.id - The user ID from the token.
	 * @param {string} req.decodedToken.organization_id - The organization ID from the token.
	 * @returns {Promise<JSON>} - The entity creation response.
	 */
	async create(req) {
		try {
			return await defaultRuleService.create(req.body, req.decodedToken.id, req.decodedToken.organization_id)
		} catch (error) {
			console.error('Error creating entity:', error)
			return error
		}
	}

	/**
	 * Updates an entity.
	 * @method
	 * @name update
	 * @param {Object} req - The request object.
	 * @param {Object} req.body - The request payload.
	 * @param {Object} req.params - The request parameters.
	 * @param {string} req.params.id - The entity ID to be updated.
	 * @param {Object} req.decodedToken - The decoded JWT token.
	 * @param {string} req.decodedToken.id - The user ID from the token.
	 * @param {string} req.decodedToken.organization_id - The organization ID from the token.
	 * @returns {Promise<JSON>} - The entity update response.
	 */
	async update(req) {
		try {
			return await defaultRuleService.update(
				req.body,
				req.params.id,
				req.decodedToken.id,
				req.decodedToken.organization_id
			)
		} catch (error) {
			console.error('Error updating entity:', error)
			return error
		}
	}

	/**
	 * Reads entities.
	 * @method
	 * @name read
	 * @param {Object} req - The request object.
	 * @param {Object} req.body - The request payload.
	 * @param {boolean} [req.body.value] - Optional value to determine entity type.
	 * @param {Object} req.decodedToken - The decoded JWT token.
	 * @param {string} req.decodedToken.id - The user ID from the token.
	 * @param {string} req.decodedToken.organization_id - The organization ID from the token.
	 * @returns {Promise<JSON>} - The entities.
	 */
	async read(req) {
		try {
			if (req.body.value) {
				return await defaultRuleService.readUserEntityTypes(
					req.body,
					req.decodedToken.id,
					req.decodedToken.organization_id
				)
			}
			return await defaultRuleService.readAllSystemEntityTypes(req.decodedToken.organization_id)
		} catch (error) {
			console.error('Error reading entities:', error)
			return error
		}
	}

	/**
	 * Deletes an entity.
	 * @method
	 * @name delete
	 * @param {Object} req - The request object.
	 * @param {Object} req.params - The request parameters.
	 * @param {string} req.params.id - The entity ID to be deleted.
	 * @param {Object} req.decodedToken - The decoded JWT token.
	 * @param {string} req.decodedToken.organization_id - The organization ID from the token.
	 * @returns {Promise<JSON>} - The entity deletion response.
	 */
	async delete(req) {
		try {
			return await defaultRuleService.delete(req.params.id, req.decodedToken.organization_id)
		} catch (error) {
			console.error('Error deleting entity:', error)
			return error
		}
	}
}
