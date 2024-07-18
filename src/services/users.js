// Dependencies
const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const userRequests = require('@requests/user')
const menteeQueries = require('@database/queries/userExtension')
const mentorQueries = require('@database/queries/mentorExtension')
const responses = require('@helpers/responses')

const IdMappingQueries = require('@database/queries/idMapping')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const mentorsService = require('@services/mentors')
const menteesService = require('@services/mentees')
const orgAdminService = require('@services/org-admin')

module.exports = class UserHelper {
	/**
	 * Get user list.
	 * @method
	 * @name create
	 * @param {String} userType 				- mentee/mentor.
	 * @param {Number} pageSize 				- Page size.
	 * @param {Number} pageNo 					- Page number.
	 * @param {String} searchText 				- Search text.
	 * @param {Number} searchText 				- userId.
	 * @returns {JSON} 							- User list.
	 */

	static async list(userType, pageNo, pageSize, searchText) {
		try {
			const userDetails = await userRequests.list(userType, pageNo, pageSize, searchText)
			const ids = userDetails.data.result.data.map((item) => item.values[0].id)

			let extensionDetails
			if (userType == common.MENTEE_ROLE) {
				extensionDetails = await menteeQueries.getUsersByUserIds(ids, {
					attributes: ['user_id', 'rating'],
				})
			} else if (userType == common.MENTOR_ROLE) {
				extensionDetails = await mentorQueries.getMentorsByUserIds(ids, {
					attributes: ['user_id', 'rating', 'mentor_visibility', 'organization_id'],
				})
				// Inside your function
				extensionDetails = extensionDetails.filter((item) => item.mentor_visibility && item.organization_id)
			}
			const extensionDataMap = new Map(extensionDetails.map((newItem) => [newItem.user_id, newItem]))

			userDetails.data.result.data = userDetails.data.result.data.filter((existingItem) => {
				const user_id = existingItem.values[0].id
				if (extensionDataMap.has(user_id)) {
					const newItem = extensionDataMap.get(user_id)
					existingItem.values[0] = { ...existingItem.values[0], ...newItem }
					delete existingItem.values[0].user_id
					delete existingItem.values[0].mentor_visibility
					delete existingItem.values[0].organization_id
					return true // Keep this item
				}

				return false // Remove this item
			})

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: userDetails.data.message,
				result: userDetails.data.result,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async create(decodedToken) {
		try {
			let isNew = false
			if (!decodedToken.id) {
				const [idMapping] = await IdMappingQueries.findOrCreate({ uuid: decodedToken.externalId })
				decodedToken.id = idMapping.id
				isNew = true
			}
			console.log('DECODED TOKEN: ', decodedToken)
			const result = await this.#createOrUpdateUserAndOrg(decodedToken.id, isNew)
			return result
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async update(updateData) {
		try {
			const userId = updateData.userId
			const [idMapping, isNew] = await IdMappingQueries.findOrCreate({ uuid: userId })
			const result = await this.#createOrUpdateUserAndOrg(idMapping.id, isNew, updateData)
			return result
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async #createOrUpdateUserAndOrg(userId, isNew, updateData = null) {
		const userDetails = await userRequests.fetchUserDetails({ userId })
		if (!userDetails?.data?.result) {
			return responses.failureResponse({
				message: 'SOMETHING_WENT_WRONG',
				statusCode: httpStatusCode.not_found,
				responseCode: 'UNAUTHORIZED',
			})
		}
		const orgExtension = await this.#createOrUpdateOrg({ uuid: userDetails.data.result.organization_id })
		const userExtensionData = this.#getExtensionData(userDetails.data.result, orgExtension)
		const result = isNew ? await this.#createUser(userExtensionData) : await this.#updateUser(userExtensionData)

		return responses.successResponse({
			statusCode: httpStatusCode.ok,
			message: 'PROFILE_CREATED_SUCCESSFULLY',
			result: result,
		})
	}

	static #getExtensionData(userDetails, orgExtension) {
		return {
			uuid: userDetails.uuid,
			id: userDetails.id,
			organization: {
				uuid: userDetails.organization_id,
				id: orgExtension.organization_id,
			},
			roles: userDetails.user_roles,
			email: userDetails.email,
			phone: userDetails.phone,
			name: userDetails.name,
		}
	}

	static async #createOrUpdateOrg(orgData) {
		const [idMapping] = await IdMappingQueries.findOrCreate({
			uuid: orgData.uuid,
		})
		const orgExtensionData = {
			...common.DEFAULT_ORGANISATION_POLICY,
			organization_id: idMapping.id,
			created_by: 1,
			updated_by: 1,
		}
		const orgExtension = await organisationExtensionQueries.upsert(orgExtensionData)
		return orgExtension.toJSON()
	}

	static async #createUser(extensionData) {
		const isAMentor = extensionData.roles.some((role) => role.title == common.MENTOR_ROLE)
		const [idMapping] = await IdMappingQueries.findOrCreate({
			uuid: extensionData.uuid,
		})
		extensionData.id = idMapping.id
		const orgId = extensionData.organization.id
		const user = isAMentor
			? await mentorsService.createMentorExtension(extensionData, idMapping.id, orgId)
			: await menteesService.createMenteeExtension(extensionData, idMapping.id, orgId)
		return user.result
	}

	static #checkOrgChange = (existingOrgId, newOrgId) => existingOrgId !== newOrgId

	static async #updateUser(extensionData) {
		const isAMentee = extensionData.roles.some((role) => role.title === common.MENTEE_ROLE)
		const roleChangePayload = {
			user_id: extensionData.id,
			organization_id: extensionData.organization.id,
		}

		let isRoleChanged = false
		let isOrgChanged = false

		if (isAMentee) {
			const menteeExtension = await menteeQueries.getMenteeExtension(extensionData.id, ['organization_id'])

			if (!menteeExtension) {
				const mentorExtension = await mentorQueries.getMentorExtension(extensionData.id, ['organization_id'])
				if (!mentorExtension) throw new Error('User Not Found')

				roleChangePayload.current_roles = [common.MENTOR_ROLE]
				roleChangePayload.new_roles = [common.MENTEE_ROLE]
				isRoleChanged = true
				isOrgChanged = this.#checkOrgChange(mentorExtension.organization_id, extensionData.organization.id)
			} else isOrgChanged = this.#checkOrgChange(menteeExtension.organization_id, extensionData.organization.id)
		} else {
			const mentorExtension = await mentorQueries.getMentorExtension(extensionData.id, ['organization_id'])

			if (!mentorExtension) {
				const menteeExtension = await menteeQueries.getMenteeExtension(extensionData.id, ['organization_id'])
				if (!menteeExtension) throw new Error('User Not Found')

				roleChangePayload.current_roles = [common.MENTEE_ROLE]
				roleChangePayload.new_roles = [common.MENTOR_ROLE]
				isRoleChanged = true
				isOrgChanged = this.#checkOrgChange(menteeExtension.organization_id, extensionData.organization.id)
			} else isOrgChanged = this.#checkOrgChange(mentorExtension.organization_id, extensionData.organization.id)
		}
		console.log('STATUSSSSSSSSSSSSS:', { isRoleChanged, isOrgChanged })
		if (isRoleChanged) {
			const roleChangeResult = await orgAdminService.roleChange(roleChangePayload, extensionData)
			return roleChangeResult.result
		} else return null
	}
}
