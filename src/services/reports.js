const httpStatusCode = require('@generics/http-status')
const responses = require('@helpers/responses')
const common = require('@constants/common')
const userRequests = require('@requests/user')
const menteeQueries = require('@database/queries/userExtension')
const sessionQueries = require('@database/queries/sessions')
const entityTypeQueries = require('@database/queries/entityType')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const mentorQueries = require('@database/queries/mentorExtension')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const { Op } = require('sequelize')

module.exports = class ReportsHelper {
	/**
	 * Get entityTypes for reports
	 * @method
	 * @name getReportFilterList
	 * @param {String} tokenInformation - token information
	 * @param {Boolean} queryParams - queryParams
	 * @returns {JSON} - Report filter list.
	 */
	static async getFilterList(entity_type, filterType, tokenInformation) {
		try {
			let result = {
				entity_types: {},
			}

			const filter_type = filterType !== '' ? filterType : common.MENTOR_ROLE

			let organization_ids = []
			const organizations = await this.getOrganizationIdBasedOnPolicy(
				tokenInformation.id,
				tokenInformation.organization_id,
				filter_type
			)

			if (organizations.success && organizations.result.length > 0) {
				organization_ids = [...organizations.result]

				if (organization_ids.length > 0) {
					const defaultOrgId = await getDefaultOrgId()
					const modelName = []
					const queryMap = {
						[common.MENTEE_ROLE]: menteeQueries.getModelName,
						[common.MENTOR_ROLE]: mentorQueries.getModelName,
						[common.SESSION]: sessionQueries.getModelName,
					}
					if (queryMap[filter_type.toLowerCase()]) {
						const modelNameResult = await queryMap[filter_type.toLowerCase()]()
						modelName.push(modelNameResult)
					}
					// get entity type with entities list
					const getEntityTypesWithEntities = await this.getEntityTypeWithEntitiesBasedOnOrg(
						organization_ids,
						entity_type,
						defaultOrgId ? defaultOrgId : '',
						modelName
					)

					if (getEntityTypesWithEntities.success && getEntityTypesWithEntities.result) {
						let entityTypesWithEntities = getEntityTypesWithEntities.result
						if (entityTypesWithEntities.length > 0) {
							let convertedData = convertEntitiesForFilter(entityTypesWithEntities)
							let doNotRemoveDefaultOrg = false
							if (organization_ids.includes(defaultOrgId)) {
								doNotRemoveDefaultOrg = true
							}
							result.entity_types = filterEntitiesBasedOnParent(
								convertedData,
								defaultOrgId,
								doNotRemoveDefaultOrg
							)
						}
					}
				}
			}

			// search for type entityType and add 'ALL' to entities list of type
			// added roles inside the result
			if (result.entity_types.type) {
				result.entity_types.type.forEach((typeObj) => {
					if (typeObj.entities) {
						typeObj.entities.push({
							entity_type_id: typeObj.id,
							value: common.ALL,
							label: common.All,
							status: common.ACTIVE_STATUS,
							type: common.SYSTEM,
						})
					}
				})
			}
			result.roles = tokenInformation.roles
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'REPORT_FILTER_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			return error
		}
	}

	static async getOrganizationIdBasedOnPolicy(userId, organization_id, filterType) {
		try {
			let organizationIds = []
			filterType = filterType.toLowerCase()

			let visibilityPolicies = []
			let orgVisibilityPolicies = []

			const policyMap = {
				[common.MENTEE_ROLE]: ['organization_id', 'external_mentee_visibility_policy'],
				[common.SESSION]: ['organization_id', 'external_session_visibility_policy'],
				[common.MENTOR_ROLE]: ['organization_id', 'external_mentor_visibility_policy'],
			}
			visibilityPolicies = policyMap[filterType] || []
			const attributes = visibilityPolicies

			const orgExtension = await organisationExtensionQueries.findOne(
				{ organization_id },
				{
					attributes: attributes,
				}
			)

			const orgPolicyMap = {
				[common.MENTEE_ROLE]: orgExtension.external_mentee_visibility_policy,
				[common.SESSION]: orgExtension.external_session_visibility_policy,
				[common.MENTOR_ROLE]: orgExtension.external_mentor_visibility_policy,
			}
			orgVisibilityPolicies = orgPolicyMap[filterType] || []
			const visibilityPolicy = orgVisibilityPolicies

			if (orgExtension?.organization_id) {
				if (visibilityPolicy === common.CURRENT) {
					organizationIds.push(orgExtension.organization_id)
				} else if (visibilityPolicy === common.ASSOCIATED || visibilityPolicy === common.ALL) {
					organizationIds.push(orgExtension.organization_id)
					let relatedOrgs = []
					let userOrgDetails = await userRequests.fetchOrgDetails({
						organizationId: orgExtension.organization_id,
					})
					if (userOrgDetails.success && userOrgDetails.data?.result?.related_orgs?.length > 0) {
						relatedOrgs = userOrgDetails.data.result.related_orgs
					}
					if (visibilityPolicy === common.ASSOCIATED) {
						const associatedAdditionalFilter =
							filterType == common.MENTEE_ROLE
								? {
										mentee_visibility_policy: {
											[Op.ne]: 'CURRENT',
										},
								  }
								: filterType == common.SESSION
								? {
										session_visibility_policy: {
											[Op.ne]: 'CURRENT',
										},
								  }
								: {
										mentor_visibility_policy: {
											[Op.ne]: 'CURRENT',
										},
								  }

						const organizationExtension = await organisationExtensionQueries.findAll(
							{
								[Op.and]: [
									{
										organization_id: {
											[Op.in]: [...relatedOrgs],
										},
									},
									associatedAdditionalFilter,
								],
							},
							{
								attributes: ['organization_id'],
							}
						)
						organizationIds.push(orgExtension.organization_id)
						if (organizationExtension) {
							const organizationIdsFromOrgExtension = organizationExtension.map(
								(orgExt) => orgExt.organization_id
							)
							organizationIds.push(...organizationIdsFromOrgExtension)
						}
					} else {
						// filter out the organizations
						// CASE 1 : in case of mentee listing filterout organizations with external_mentee_visibility_policy = ALL
						// CASE 2 : in case of session listing filterout organizations with session_visibility_policy = ALL
						// CASE 3 : in case of mentor listing filterout organizations with mentor_visibility_policy = ALL
						const filterQuery =
							filterType == common.MENTEE_ROLE
								? {
										mentee_visibility_policy: common.ALL, //1
								  }
								: filterType == common.SESSION
								? {
										session_visibility_policy: common.ALL, //2
								  }
								: {
										mentor_visibility_policy: common.ALL, //3
								  }

						// this filter is applied for the below condition
						// SM mentee_visibility_policy (in case of mentee list) or external_mentor_visibility policy (in case of mentor list) = ALL
						//  and CASE 1 (mentee list) : Mentees is related to the SM org but external_mentee_visibility is CURRENT (exclude these mentees)
						//  CASE 2 : (session list) : Sessions is related to the SM org but session_visibility is CURRENT (exclude these sessions)
						//  CASE 3 : (mentor list) : Mentors is related to SM Org but mentor_visibility set to CURRENT  (exclude these mentors)
						const additionalFilter =
							filterType == common.MENTEE_ROLE
								? {
										mentee_visibility_policy: {
											//1
											[Op.ne]: 'CURRENT',
										},
								  }
								: filterType == common.SESSION
								? {
										session_visibility_policy: {
											//2
											[Op.ne]: 'CURRENT',
										},
								  }
								: {
										mentor_visibility_policy: {
											//3
											[Op.ne]: 'CURRENT',
										},
								  }
						const organizationExtension = await organisationExtensionQueries.findAll(
							{
								[Op.or]: [
									filterQuery,
									{
										[Op.and]: [
											{
												organization_id: {
													[Op.in]: [...relatedOrgs],
												},
											},
											additionalFilter,
										],
									},
								],
							},
							{
								attributes: ['organization_id'],
							}
						)
						organizationIds.push(orgExtension.organization_id)
						if (organizationExtension) {
							const organizationIdsFromOrgExtension = organizationExtension.map(
								(orgExt) => orgExt.organization_id
							)
							organizationIds.push(...organizationIdsFromOrgExtension)
						}
					}
				}
			}

			return {
				success: true,
				result: organizationIds,
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	static async getEntityTypeWithEntitiesBasedOnOrg(organization_ids, entity_types, defaultOrgId = '', modelName) {
		try {
			let filter = {
				status: common.ACTIVE_STATUS,
				allow_filtering: true,
				has_entities: true,
				organization_id: {
					[Op.in]: defaultOrgId ? [...organization_ids, defaultOrgId] : organization_ids,
				},
				report_filter: true,
			}

			let entityTypes = []
			if (entity_types) {
				entityTypes = entity_types.split(',')
				filter.value = {
					[Op.in]: entityTypes,
				}
			}

			if (modelName) {
				filter.model_names = { [Op.contains]: [modelName] }
			}
			//fetch entity types and entities
			let entityTypesWithEntities = await entityTypeQueries.findUserEntityTypesAndEntities(filter)

			return {
				success: true,
				result: entityTypesWithEntities,
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}
}

function convertEntitiesForFilter(entityTypes) {
	const result = {}

	entityTypes.forEach((entityType) => {
		const key = entityType.value

		if (!result[key]) {
			result[key] = []
		}

		const newObj = {
			id: entityType.id,
			label: entityType.label,
			value: entityType.value,
			parent_id: entityType.parent_id,
			organization_id: entityType.organization_id,
			entities: entityType.entities || [],
		}

		result[key].push(newObj)
	})
	return result
}

function filterEntitiesBasedOnParent(data, defaultOrgId, doNotRemoveDefaultOrg) {
	let result = {}

	for (let key in data) {
		let countWithParentId = 0
		let countOfEachKey = data[key].length
		data[key].forEach((obj) => {
			if (obj.parent_id !== null && obj.organization_id != defaultOrgId) {
				countWithParentId++
			}
		})

		let outputArray = data[key]
		if (countOfEachKey > 1 && countWithParentId == countOfEachKey - 1 && !doNotRemoveDefaultOrg) {
			outputArray = data[key].filter((obj) => !(obj.organization_id === defaultOrgId && obj.parent_id === null))
		}

		result[key] = outputArray
	}
	return result
}
