const fs = require('fs')
const readline = require('readline')
const csv = require('csv-parser')
const { Sequelize } = require('sequelize')
const { EntityType, Entity } = require('../../database/models/index')

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'postgres',
})

const listCSVFiles = (dir) => {
	return fs.readdirSync(dir).filter((file) => file.endsWith('.csv'))
}

const insertEntityType = async (fileName) => {
	const label = fileName.replace(/\.csv$/i, '')
	const entityType = await EntityType.create({ value: fileName, label })
	return entityType.id
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
					type: 'default',
				})
			})
			.on('end', async () => {
				await Entity.bulkCreate(entities)
				resolve()
			})
			.on('error', reject)
	})
}

const main = async () => {
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

	rl.question('Select a file to insert into the database (or 0 to exit): ', async (answer) => {
		const fileIndex = parseInt(answer, 10) - 1
		rl.close()

		if (fileIndex === -1) {
			console.log('Exiting...')
			process.exit(0)
		}

		if (fileIndex < 0 || fileIndex >= csvFiles.length) {
			console.log('Invalid selection. Exiting...')
			process.exit(1)
		}

		const selectedFile = csvFiles[fileIndex]
		const filePath = `${dir}/${selectedFile}`

		try {
			await sequelize.authenticate()
			console.log('Connection has been established successfully.')

			const entityTypeId = await insertEntityType(selectedFile)
			await insertEntitiesFromCSV(filePath, entityTypeId)

			console.log('Data has been inserted successfully.')
			process.exit(0)
		} catch (error) {
			console.error('Unable to connect to the database:', error)
			process.exit(1)
		}
	})
}

main()
