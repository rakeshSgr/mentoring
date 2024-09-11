const readline = require('readline')
const fs = require('fs')
const axios = require('axios')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

let accessToken = ''
let adminAuthToken = ''
let organizationId = ''

const DEFAULT_MENTORING_DOMAIN = 'http://localhost:3569'
let MENTORING_DOMAIN = DEFAULT_MENTORING_DOMAIN

async function main() {
	try {
		await promptForDomain()
		await promptForAccessToken()
		await promptForAdminAuthToken()
		await promptForOrganizationId()
		return await deleteEntityType()
	} catch (error) {
		console.error('Error occurred:', error)
	} finally {
		rl.close()
	}
}

async function promptForDomain() {
	const domain = await promptQuestion(`Enter domain (default: ${DEFAULT_MENTORING_DOMAIN}): `)
	if (domain) {
		MENTORING_DOMAIN = domain
	}
	console.log(`Using domain: ${MENTORING_DOMAIN}`)
}

async function promptForAccessToken() {
	accessToken = await promptQuestion('Enter access token: ')
}

async function promptForAdminAuthToken() {
	adminAuthToken = await promptQuestion('Enter admin Auth Token: ')
}

async function promptForOrganizationId() {
	organizationId = await promptQuestion('Enter organization Id: ')
}

async function deleteEntityType() {
	try {
		const response = await axios.delete(`${MENTORING_DOMAIN}/mentoring/v1/entity-type/delete`, {
			headers: {
				'x-auth-token': `bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'admin-auth-token': `${adminAuthToken}`,
				'organization-id': `${organizationId}`,
			},
			data: JSON.stringify({ value: ['designation', 'recommended_for', 'categories', 'area_of_expertise'] }),
		})

		//	entityTypeId = response.data.result.id
		console.log(response.data.message)
	} catch (error) {
		console.error('Entity type creation failed:', error)
		throw error
	}
}

function promptQuestion(question, hidden = false) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim())
		})

		if (hidden) {
			rl.output.write('\x1B[?25l')
		}
	})
}

main()
