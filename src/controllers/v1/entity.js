/**
 * name : entity.js
 * author : Aman Gupta
 * created-date : 04-Nov-2021
 * Description : Entity Controller.
 */

// Dependencies
const entityService = require('@services/entity')

module.exports = class Entity {
	/**
	 * create entity
	 * @method
	 * @name create
	 * @param {Object} req - request data.
	 * @returns {JSON} - entities creation object.
	 */

	async create(req) {
		const params = req.body
		try {
			const createdEntity = await entityService.create(params, req.decodedToken.id)
			return createdEntity
		} catch (error) {
			return error
		}
	}

	/**
	 * updates entity
	 * @method
	 * @name update
	 * @param {Object} req - request data.
	 * @returns {JSON} - entities updation response.
	 */

	async update(req) {
		const params = req.body
		const id = req.params.id
		try {
			const updatedEntity = await entityService.update(params, id, req.decodedToken.id)
			return updatedEntity
		} catch (error) {
			return error
		}
	}

	/**
	 * reads entities
	 * @method
	 * @name read
	 * @param {Object} req - request data.
	 * @returns {JSON} - entities.
	 */

	async read(req) {
		try {
			console.log('req ---------------', req.searchText)
			// req.query ;
			req['decodedToken'] = {}
			req['decodedToken']['id'] = 0
			// req.decodedToken.id = "0"
			if (req.query.id || req.query.value) {
				return await entityService.read(req.query, req.decodedToken.id)
			}
			let entityType = req.query ? (req.query.entity_type_id ? req.query.entity_type_id : '') : ''

			return await entityService.readAll(req.query, req.decodedToken.id, req.searchText, entityType)
		} catch (error) {
			return error
		}
	}

	/**
	 * deletes entity
	 * @method
	 * @name delete
	 * @param {Object} req - request data.
	 * @returns {JSON} - entities deletion response.
	 */

	async delete(req) {
		try {
			const updatedEntity = await entityService.delete(req.params.id, req.decodedToken.id)
			return updatedEntity
		} catch (error) {
			return error
		}
	}

	/**
	 * entity details
	 * @method
	 * @name details
	 * @param {Object} req - request data.
	 * @returns {JSON} - entities.
	 */

	async details(req) {
		try {
			return await entityService.details(req.query, req.decodedToken.id, req.searchText, req.pageNo, req.pageSize)
		} catch (error) {
			return error
		}
	}
}
