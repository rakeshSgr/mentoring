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

	static getExtensionData(userDetails, orgExtension) {
		return {
			uuid: userDetails.id,
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

	static async create(decodedToken) {
		try {
			let isNew = false
			if (!decodedToken.id) {
				decodedToken.id = (await IdMappingQueries.create({ uuid: decodedToken.externalId })).id
				isNew = true
			}
			const userDetails = await userRequests.fetchUserDetails({ userId: decodedToken.id })
			if (!userDetails?.data?.result)
				return responses.failureResponse({
					message: 'SOMETHING_WENT_WRONG',
					statusCode: httpStatusCode.not_found,
					responseCode: 'UNAUTHORIZED',
				})

			const orgExtension = await this.createOrg({ uuid: userDetails.data.result.organization_id })
			const extensionData = this.getExtensionData(userDetails.data.result, orgExtension)
			const result = await this.createUser(extensionData, isNew)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'PROFILE_CREATED_SUCCESSFULLY',
				result: result,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async createOrg(orgData) {
		const idUuidMapping = await IdMappingQueries.create({
			uuid: orgData.uuid,
		})
		const extensionData = {
			...common.DEFAULT_ORGANISATION_POLICY,
			organization_id: idUuidMapping.id,
			created_by: 1,
			updated_by: 1,
		}
		const orgExtension = await organisationExtensionQueries.upsert(extensionData)
		return orgExtension.toJSON()
	}

	static async createUser(extensionData, isNew) {
		const isAMentor = extensionData.roles.some((role) => role.title == common.MENTOR_ROLE)
		const idUuidMapping = await IdMappingQueries.create({
			uuid: extensionData.uuid,
		})
		extensionData.id = idUuidMapping.id
		const orgId = extensionData.organization.id
		let user
		if (isAMentor) {
			user = isNew
				? await mentorsService.createMentorExtension(extensionData, idUuidMapping.id, orgId)
				: await mentorsService.updateMentorExtension(extensionData, idUuidMapping.id, orgId)
		} else {
			user = isNew
				? await menteesService.createMenteeExtension(extensionData, idUuidMapping.id, orgId)
				: await menteesService.updateMenteeExtension(extensionData, idUuidMapping.id, orgId)
		}
		return user.result
	}
}
