/**
 * name : configs/kafka
 * author : Aman Gupta
 * Date : 07-Dec-2021
 * Description : Kafka connection configurations
 */

const utils = require('@generics/utils')
const { elevateLog } = require('elevate-logger')
const logger = elevateLog.init()
const { Kafka } = require('kafkajs')

module.exports = async () => {
	try {
		const kafkaIps = process.env.KAFKA_URL.split(',')
		console.log('KafkaProvider: Kafka IPs obtained', { kafkaIps })

		const KafkaClient = new Kafka({
			clientId: 'mentoring',
			brokers: kafkaIps,
		})

		const producer = KafkaClient.producer()
		const consumer = KafkaClient.consumer({ groupId: process.env.KAFKA_GROUP_ID })

		// Attempting to connect to producer
		try {
			console.log('KafkaProvider: Connecting to Kafka producer')
			await producer.connect()
			console.log('KafkaProvider: Kafka producer connected')
		} catch (err) {
			console.log('KafkaProvider: Error connecting to Kafka producer', { err })
			// Handle or retry producer connection here if needed
			throw new Error('Kafka producer connection failed')
		}

		// Attempting to connect to consumer
		try {
			console.log('KafkaProvider: Connecting to Kafka consumer')
			await consumer.connect()
			console.log('KafkaProvider: Kafka consumer connected')
		} catch (err) {
			console.log('KafkaProvider: Error connecting to Kafka consumer', { err })
			// Handle or retry consumer connection here if needed
			throw new Error('Kafka consumer connection failed')
		}

		// Event listeners for connection status
		producer.on('producer.connect', () => {
			console.log('KafkaProvider: Producer connected')
		})

		producer.on('producer.disconnect', () => {
			console.log('KafkaProvider: Producer disconnected', {
				triggerNotification: true,
			})
		})

		// Subscribe to Kafka consumer and process messages
		const subscribeToConsumer = async () => {
			try {
				console.log('KafkaProvider: Subscribing to consumer topics')
				await consumer.subscribe({ topics: [process.env.CLEAR_INTERNAL_CACHE] })
				console.log('KafkaProvider: Consumer subscribed to topics')

				await consumer.run({
					eachMessage: async ({ topic, partition, message }) => {
						try {
							let streamingData = JSON.parse(message.value)
							console.log('KafkaProvider: Received message', { streamingData })

							if (streamingData.type == 'CLEAR_INTERNAL_CACHE') {
								console.log('KafkaProvider: Clearing internal cache', { cacheKey: streamingData.value })
								utils.internalDel(streamingData.value)
							}
						} catch (error) {
							console.log('KafkaProvider: Error processing message', { error })
							throw error
						}
					},
				})
			} catch (err) {
				console.log('KafkaProvider: Error subscribing to or running consumer', { err })
				throw err
			}
		}

		await subscribeToConsumer()

		// Assigning to global variables
		global.kafkaProducer = producer
		global.kafkaClient = KafkaClient
		console.log('KafkaProvider: Kafka producer and client set globally')
	} catch (err) {
		// Log any error that occurs during the whole process
		console.log('KafkaProvider: Kafka initialization error', { err })
		console.log('Kafka error ============', err)
	}
}
