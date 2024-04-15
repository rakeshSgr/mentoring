'use strict'
const responses = require('@helpers/responses')
const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const IdMappingQueries = require('@database/queries/idMapping')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const mentorsService = require('@services/mentors')
const menteesService = require('@services/mentees')
const userRequests = require('@requests/user')

module.exports = class ExternalHelper {
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
