require('dotenv').config({ path: '../.env' })
const readline = require('readline')
const { Sequelize } = require('sequelize')
const { EntityType } = require('../database/models/index')

// Initialize readline for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

// Get the connection string and initialize Sequelize
const connectionString = process.env.DEV_DATABASE_URL
const sequelize = new Sequelize(connectionString)

// Function to update a specific field of the EntityType
async function updateEntityField(entityTypeName, fieldToUpdate, newValue) {
	try {
		// Find the entity type
		const entityType = await EntityType.findOne({ where: { value: entityTypeName } })

		if (!entityType) {
			console.log(`Entity type '${entityTypeName}' not found.`)
			return
		}

		// Update the specific field dynamically
		entityType[fieldToUpdate] = newValue

		// Save the updated entity
		await entityType.save()

		console.log(`Updated '${fieldToUpdate}' to '${newValue}' for entity type '${entityTypeName}'.`)
	} catch (error) {
		console.error('Error updating EntityType:', error)
	}
}

// Prompt for the entity type
rl.question('Please enter the Entity Type value to update: ', (entityTypeName) => {
	if (!entityTypeName) {
		console.log('No entity type provided.')
		rl.close()
		return
	}

	// After getting the entity type, ask for the field to update
	rl.question('Which field would you like to update? ', (fieldToUpdate) => {
		if (!fieldToUpdate) {
			console.log('No field provided.')
			rl.close()
			return
		}

		// Now ask for the new value for that field
		rl.question(`Enter the new value for ${fieldToUpdate}: `, async (newValue) => {
			if (!newValue) {
				console.log('No value provided.')
				rl.close()
				return
			}

			// Perform the update with the provided values
			await updateEntityField(entityTypeName, fieldToUpdate, newValue)

			// Close readline after the update
			rl.close()
		})
	})
})
