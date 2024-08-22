const jwt = require('jsonwebtoken')
const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const requests = require('@generics/requests')
const endpoints = require('@constants/endpoints')
const rolePermissionMappingQueries = require('@database/queries/role-permission-mapping')
const responses = require('@helpers/responses')
const { Op } = require('sequelize')
const fs = require('fs')
const MenteeExtensionQueries = require('@database/queries/userExtension')

module.exports = async function (req, res, next) {
	try {
		const authHeader = req.get(process.env.AUTH_TOKEN_HEADER_NAME)
		let adminHeader = false
		if (process.env.ADMIN_ACCESS_TOKEN) adminHeader = req.get(process.env.ADMIN_TOKEN_HEADER_NAME)

		const isInternalAccess = common.internalAccessUrls.some((path) => {
			if (req.path.includes(path)) {
				if (req.headers.internal_access_token === process.env.INTERNAL_ACCESS_TOKEN) return true
				throw createUnauthorizedResponse()
			}
			return false
		})

		if (isInternalAccess && !authHeader) return next()
		if (!authHeader) {
			const isPermissionValid = await checkPermissions(common.PUBLIC_ROLE, req.path, req.method)
			if (isPermissionValid) return next()
			else throw createUnauthorizedResponse('PERMISSION_DENIED')
		}

		const [decodedToken, skipFurtherChecks] = await authenticateUser(authHeader, req)

		if (adminHeader) {
			if (adminHeader != process.env.ADMIN_ACCESS_TOKEN) throw createUnauthorizedResponse()
			const organizationId = req.get(process.env.ORG_ID_HEADER_NAME)

			if (!organizationId) {
				throw responses.failureResponse({
					message: {
						key: 'ADD_ORG_HEADER',
						interpolation: {
							orgIdHeader: process.env.ORG_ID_HEADER_NAME,
							adminHeader: process.env.ADMIN_TOKEN_HEADER_NAME,
						},
					},
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			decodedToken.data.organization_id = organizationId.toString()
			decodedToken.data.roles.push({ title: common.ADMIN_ROLE })
		}

		if (!skipFurtherChecks) {
			if (process.env.SESSION_VERIFICATION_METHOD === common.SESSION_VERIFICATION_METHOD.USER_SERVICE)
				await validateSession(authHeader)

			const roleValidation = common.roleValidationPaths.some((path) => req.path.includes(path))

			if (roleValidation) {
				if (process.env.AUTH_METHOD === common.AUTH_METHOD.NATIVE) await nativeRoleValidation(decodedToken)
				else if (process.env.AUTH_METHOD === common.AUTH_METHOD.KEYCLOAK_PUBLIC_KEY)
					await dbBasedRoleValidation(decodedToken)
			}

			const isPermissionValid = await checkPermissions(
				decodedToken.data.roles.map((role) => role.title),
				req.path,
				req.method
			)

			if (!isPermissionValid) throw createUnauthorizedResponse('PERMISSION_DENIED')
		}

		req.decodedToken = {
			id: typeof decodedToken.data.id === 'number' ? decodedToken.data.id.toString() : decodedToken.data.id,
			roles: decodedToken.data.roles,
			name: decodedToken.data.name,
			token: authHeader,
			organization_id:
				typeof decodedToken.data.organization_id === 'number'
					? decodedToken.data.organization_id.toString()
					: decodedToken.data.organization_id,
		}

		console.log('DECODED TOKEN:', req.decodedToken)
		next()
	} catch (err) {
		if (err.message === 'USER_SERVICE_DOWN') {
			err = responses.failureResponse({
				message: 'USER_SERVICE_DOWN',
				statusCode: httpStatusCode.internal_server_error,
				responseCode: 'SERVER_ERROR',
			})
		}
		console.error(err)
		next(err)
	}
}

function createUnauthorizedResponse(message = 'UNAUTHORIZED_REQUEST') {
	return responses.failureResponse({
		message,
		statusCode: httpStatusCode.unauthorized,
		responseCode: 'UNAUTHORIZED',
	})
}

async function checkPermissions(roleTitle, requestPath, requestMethod) {
	const parts = requestPath.match(/[^/]+/g)
	const apiPath = getApiPaths(parts)
	const allowedPermissions = await fetchPermissions(roleTitle, apiPath, parts[2])
	return allowedPermissions.some((permission) => permission.request_type.includes(requestMethod))
}

function getApiPaths(parts) {
	const apiPath = [`/${parts[0]}/${parts[1]}/${parts[2]}/*`]
	if (parts[4]) apiPath.push(`/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}*`)
	else
		apiPath.push(
			`/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}`,
			`/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}*`
		)
	return apiPath
}

async function fetchPermissions(roleTitle, apiPath, module) {
	if (Array.isArray(roleTitle) && !roleTitle.includes(common.PUBLIC_ROLE)) roleTitle.push(common.PUBLIC_ROLE)
	const filter = { role_title: roleTitle, module, api_path: { [Op.in]: apiPath } }
	const attributes = ['request_type', 'api_path', 'module']
	return await rolePermissionMappingQueries.findAll(filter, attributes)
}

async function verifyToken(token) {
	try {
		return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	} catch (err) {
		if (err.name === 'TokenExpiredError') throw createUnauthorizedResponse('ACCESS_TOKEN_EXPIRED')
		console.log(err)
		throw createUnauthorizedResponse()
	}
}

async function validateSession(authHeader) {
	const userBaseUrl = `${process.env.USER_SERVICE_HOST}${process.env.USER_SERVICE_BASE_URL}`
	const validateSessionEndpoint = `${userBaseUrl}${endpoints.VALIDATE_SESSIONS}`
	const reqBody = { token: authHeader }

	const isSessionActive = await requests.post(validateSessionEndpoint, reqBody, '', true)

	if (isSessionActive?.data?.responseCode === 'UNAUTHORIZED') throw createUnauthorizedResponse('ACCESS_TOKEN_EXPIRED')
	if (!isSessionActive?.success || !isSessionActive?.data?.result?.data?.user_session_active)
		throw new Error('USER_SERVICE_DOWN')
}

async function fetchUserProfile(userId) {
	const userBaseUrl = `${process.env.USER_SERVICE_HOST}${process.env.USER_SERVICE_BASE_URL}`
	const profileUrl = `${userBaseUrl}${endpoints.USER_PROFILE_DETAILS}/${userId}`
	const user = await requests.get(profileUrl, null, true)

	if (!user || !user.success) throw createUnauthorizedResponse('USER_NOT_FOUND')
	if (user.data.result.deleted_at !== null) throw createUnauthorizedResponse('USER_ROLE_UPDATED')
	return user.data.result
}

function isMentorRole(roles) {
	return roles.some((role) => role.title === common.MENTOR_ROLE)
}

async function dbBasedRoleValidation(decodedToken) {
	const userId = decodedToken.data.id
	const roles = decodedToken.data.roles
	const isMentor = isMentorRole(roles)

	const menteeExtension = await MenteeExtensionQueries.getMenteeExtension(userId.toString(), ['user_id', 'is_mentor'])
	if (!menteeExtension) throw createUnauthorizedResponse('USER_NOT_FOUND')

	const roleMismatch = (isMentor && !menteeExtension.is_mentor) || (!isMentor && menteeExtension.is_mentor)
	if (roleMismatch) throw createUnauthorizedResponse('USER_ROLE_UPDATED')
}

function isAdminRole(roles) {
	return roles.some((role) => role.title === common.ADMIN_ROLE)
}

async function authenticateUser(authHeader, req) {
	if (!authHeader) throw createUnauthorizedResponse()

	let token
	if (process.env.IS_AUTH_TOKEN_BEARER === 'true') {
		const [authType, extractedToken] = authHeader.split(' ')
		if (authType.toLowerCase() !== 'bearer') throw createUnauthorizedResponse()
		token = extractedToken.trim()
	} else token = authHeader.trim()

	let decodedToken = null
	if (process.env.AUTH_METHOD === common.AUTH_METHOD.NATIVE) decodedToken = await verifyToken(token)
	else if (process.env.AUTH_METHOD === common.AUTH_METHOD.KEYCLOAK_PUBLIC_KEY)
		decodedToken = await keycloakPublicKeyAuthentication(token)
	if (!decodedToken) throw createUnauthorizedResponse()

	if (decodedToken.data.roles && isAdminRole(decodedToken.data.roles)) {
		req.decodedToken = decodedToken.data
		return [decodedToken, true]
	}

	return [decodedToken, false]
}

async function nativeRoleValidation(decodedToken) {
	const userProfile = await fetchUserProfile(decodedToken.data.id)
	decodedToken.data.roles = userProfile.user_roles
	decodedToken.data.organization_id = userProfile.organization_id
}

const keycloakPublicKeyPath = `${process.env.KEYCLOAK_PUBLIC_KEY_PATH}/`
const PEM_FILE_BEGIN_STRING = '-----BEGIN PUBLIC KEY-----'
const PEM_FILE_END_STRING = '-----END PUBLIC KEY-----'

const validRoles = new Set([
	common.MENTEE_ROLE,
	common.MENTOR_ROLE,
	common.ORG_ADMIN_ROLE,
	common.ADMIN_ROLE,
	common.SESSION_MANAGER_ROLE,
])

async function keycloakPublicKeyAuthentication(token) {
	try {
		const tokenClaims = jwt.decode(token, { complete: true })
		if (!tokenClaims || !tokenClaims.header) throw createUnauthorizedResponse()
		const kid = tokenClaims.header.kid
		const path = keycloakPublicKeyPath + kid.replace(/\.\.\//g, '')
		const accessKeyFile = await fs.promises.readFile(path, 'utf8')
		const cert = accessKeyFile.includes(PEM_FILE_BEGIN_STRING)
			? accessKeyFile
			: `${PEM_FILE_BEGIN_STRING}\n${accessKeyFile}\n${PEM_FILE_END_STRING}`

		const verifiedClaims = await verifyKeycloakToken(token, cert)
		const externalUserId = verifiedClaims.sub.split(':').pop()

		let isMentor = false
		let isMenteeRolePresent = false

		let roles = verifiedClaims.user_roles.reduce((acc, role) => {
			role = role.toLowerCase()
			if (validRoles.has(role)) {
				if (role === common.MENTOR_ROLE) isMentor = true
				else if (role === common.MENTEE_ROLE) isMenteeRolePresent = true
				acc.push({ title: role })
			}
			return acc
		}, [])

		if (!isMentor && !isMenteeRolePresent) roles.push({ title: common.MENTEE_ROLE })

		return {
			data: {
				id: externalUserId,
				roles: roles,
				name: verifiedClaims.name,
				organization_id: verifiedClaims.org || null,
			},
		}
	} catch (err) {
		if (err.message === 'USER_NOT_FOUND') throw createUnauthorizedResponse('USER_NOT_FOUND')
		else {
			console.error(err)
			throw createUnauthorizedResponse()
		}
	}
}

async function verifyKeycloakToken(token, cert) {
	try {
		return jwt.verify(token, cert, { algorithms: ['sha1', 'RS256', 'HS256'] })
	} catch (err) {
		if (err.name === 'TokenExpiredError') throw createUnauthorizedResponse('ACCESS_TOKEN_EXPIRED')
		console.error(err)
		throw createUnauthorizedResponse()
	}
}
