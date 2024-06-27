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

	static async create(decodedToken) {
		if (!decodedToken.id) decodedToken.id = (await IdMappingQueries.create({ uuid: decodedToken.externalId })).id
		const userDetails = await userRequests.fetchUserDetails({ userId: decodedToken.id })
		if (!userDetails.data.result)
			return responses.failureResponse({
				message: 'SOMETHING_WENT_WRONG',
				statusCode: httpStatusCode.not_found,
				responseCode: 'UNAUTHORIZED',
			})

		await this.createOrg({ id: userDetails.data.result.organization_id })
		const userData = {
			id: userDetails.data.result.id,
			organization: {
				id: userDetails.data.result.organization_id,
			},
			roles: userDetails.data.result.user_roles,
		}
		const result = await this.createUser(userData)

		return responses.successResponse({
			statusCode: httpStatusCode.ok,
			message: 'PROFILE_CREATED_SUCCESSFULLY',
			result: result,
		})
	}

	static async createOrg(orgData) {
		try {
			const idUuidMapping = await IdMappingQueries.create({
				uuid: orgData.id,
			})
			const extensionData = {
				...common.DEFAULT_ORGANISATION_POLICY,
				organization_id: idUuidMapping.id,
				created_by: 1,
				updated_by: 1,
			}
			const orgExtension = await organisationExtensionQueries.upsert(extensionData)
			return orgExtension.toJSON()
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async createUser(userData) {
		try {
			const isAMentor = userData.roles.some((role) => role.title == common.MENTOR_ROLE)
			const idUuidMapping = await IdMappingQueries.create({
				uuid: userData.id,
			})
			const orgId = await IdMappingQueries.getIdByUuid(userData.organization.id)
			const user = isAMentor
				? await mentorsService.createMentorExtension(userData, idUuidMapping.id, orgId)
				: await menteesService.createMenteeExtension(userData, idUuidMapping.id, orgId)
			return user.result
		} catch (error) {
			console.log(error)
			throw error
		}
	}
}
