require('dotenv').config({ path: '../../.env' })
const fs = require('fs')
const readline = require('readline')
const csv = require('csv-parser')
const { Sequelize } = require('sequelize')
const { EntityType, Entity } = require('../../database/models/index')

const connectionString = process.env.DEV_DATABASE_URL
const sequelize = new Sequelize(connectionString)

const listCSVFiles = (dir) => {
	return fs.readdirSync(dir).filter((file) => file.endsWith('.csv'))
}

const promptUser = (rl, question) => {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer)
		})
	})
}

const insertEntityType = async (fileName, dataType, modelNames, allowCustomEntities) => {
	let label = fileName.replace(/\.csv$/i, '')
	label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
	const entityType = await EntityType.create({
		value: label.toLowerCase(),
		label,
		status: 'ACTIVE',
		created_by: 0,
		updated_by: 0,
		data_type: dataType,
		allow_filtering: true,
		organization_id: process.env.DEFAULT_ORG_ID,
		has_entities: true,
		allow_custom_entities: allowCustomEntities,
		model_names: modelNames,
	})
	return entityType
}

const insertEntitiesFromCSV = async (filePath, entityTypeId) => {
	const entities = []
	return new Promise((resolve, reject) => {
		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', (row) => {
				entities.push({
					entity_type_id: entityTypeId,
					value: row.identifier,
					label: row.entity,
					status: 'ACTIVE',
					type: 'SYSTEM',
					created_by: 0,
				})
			})
			.on('end', async () => {
				await Entity.bulkCreate(entities)
				resolve(entities)
			})
			.on('error', reject)
	})
}

const displayTables = (entityType, entities) => {
	console.log('Entity Type:')
	console.table([
		{
			ID: entityType.id,
			Value: entityType.value,
			Label: entityType.label,
			Status: entityType.status,
			DataType: entityType.data_type,
			AllowCustomEntities: entityType.allow_custom_entities,
			ModelNames: entityType.model_names.join(', '),
		},
	])

	console.log('Entities:')
	console.table(
		entities.map((entity) => ({
			EntityTypeID: entity.entity_type_id,
			Value: entity.value,
			Label: entity.label,
			Status: entity.status,
			Type: entity.type,
		}))
	)
}

const main = async () => {
	while (true) {
		const dir = './'
		const csvFiles = listCSVFiles(dir)

		if (csvFiles.length === 0) {
			console.log('No CSV files found in the directory.')
			process.exit(0)
		}

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		})

		console.log('CSV files:')
		csvFiles.forEach((file, index) => {
			console.log(`${index + 1}. ${file}`)
		})
		console.log('0. Exit')

		const fileIndex =
			parseInt(await promptUser(rl, 'Select a file to insert into the database (or 0 to exit): '), 10) - 1

		if (fileIndex === -1) {
			console.log('Exiting...')
			rl.close()
			process.exit(0)
		}

		if (fileIndex < 0 || fileIndex >= csvFiles.length) {
			console.log('Invalid selection. Try again.')
			continue
		}

		const dataTypeOptions = ['STRING', 'ARRAY[STRING]']
		const modelNameOptions = ['Session', 'MentorExtension', 'UserExtension']

		console.log('Data type options:')
		dataTypeOptions.forEach((option, index) => {
			console.log(`${index + 1}. ${option}`)
		})

		const dataTypeIndex = parseInt(await promptUser(rl, 'Select data type (number): '), 10) - 1
		if (dataTypeIndex < 0 || dataTypeIndex >= dataTypeOptions.length) {
			console.log('Invalid data type. Try again.')
			continue
		}
		const dataType = dataTypeOptions[dataTypeIndex]

		console.log('Model name options:')
		modelNameOptions.forEach((option, index) => {
			console.log(`${index + 1}. ${option}`)
		})

		const modelNamesAnswer = await promptUser(rl, 'Select model names (space-separated numbers, e.g., "1 2 3"): ')
		const modelNameIndices = modelNamesAnswer.split(' ').map((num) => parseInt(num, 10) - 1)
		const modelNames = modelNameIndices.map((index) => modelNameOptions[index]).filter((name) => name !== undefined)

		const allowCustomEntitiesAnswer = await promptUser(rl, 'Allow custom entities? (y/n, default is y): ')
		const allowCustomEntities = allowCustomEntitiesAnswer.toLowerCase() === 'n' ? false : true

		rl.close()

		const selectedFile = csvFiles[fileIndex]
		const filePath = `${dir}/${selectedFile}`

		try {
			await sequelize.authenticate()

			const entityType = await insertEntityType(selectedFile, dataType, modelNames, allowCustomEntities)
			const entities = await insertEntitiesFromCSV(filePath, entityType.id)

			console.log('Data has been inserted successfully.')
			displayTables(entityType, entities)
		} catch (error) {
			console.error('Unable to connect to the database:', error)
		}
	}
}

main()
