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

const sessionsHelper = require('@services/helper/sessions')

module.exports = async () => {
	const kafkaIps = process.env.KAFKA_URL.split(',')
	const KafkaClient = new Kafka({
		clientId: 'mentoring',
		brokers: kafkaIps,
	})

	const producer = KafkaClient.producer()
	const consumer = KafkaClient.consumer({ groupId: process.env.KAFKA_GROUP_ID })

	await producer.connect()
	await consumer.connect()

	producer.on('producer.connect', () => {
		logger.info(`KafkaProvider: connected`)
	})
	producer.on('producer.disconnect', () => {
		logger.error(`KafkaProvider: could not connect`, {
			triggerNotification: true,
		})
	})

	const subscribeToConsumer = async () => {
		await consumer.subscribe({
			topics: [
				process.env.CLEAR_INTERNAL_CACHE,
				process.env.KAFKA_SESSION_SUMMARY_TOPIC,
				process.env.KAFKA_DISCORD_DETAILS_TOPIC,
			],
		})
		await consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				try {
					let messageData = message.value

					let streamingData = JSON.parse(messageData)

					if (typeof streamingData == 'string') {
						streamingData = JSON.parse(streamingData)
					}
					if (streamingData.type == 'CLEAR_INTERNAL_CACHE') {
						utils.internalDel(streamingData.value)
					} else if (streamingData.type == 'SESSION_SUMMARY') {
						let update = {
							summary: streamingData.sessionSummary,
						}

						await sessionsHelper.sessionUpdateFromKafka(streamingData.sessionId, update)
					} else if (streamingData.type == 'SESSION_DISCORD') {
						let update = {
							channelId: streamingData.channelId,
							inviteLink: streamingData.inviteLink,
							channelName: streamingData.channelName,
						}
						await sessionsHelper.sessionUpdateFromKafka(streamingData.sessionId, update)
					}
				} catch (error) {
					throw error
				}
			},
		})
	}
	subscribeToConsumer()

	global.kafkaProducer = producer
	global.kafkaClient = KafkaClient
}
