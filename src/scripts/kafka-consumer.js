const { Kafka } = require('kafkajs')

// Create a Kafka instance
const kafka = new Kafka({
	clientId: 'mentoring',
	brokers: ['10.175.3.38:9092'], // Replace with your Kafka broker(s)
})

// Create a consumer instance
const consumer = kafka.consumer({ groupId: 'test-group' }) // Replace with your group ID

const run = async () => {
	// Connect the consumer to the Kafka broker
	await consumer.connect()

	// Subscribe to the topic
	await consumer.subscribe({ topic: 'dev.mentoring.notifications', fromBeginning: true }) // Replace with your topic name

	// Run the consumer
	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			console.log({
				topic,
				partition,
				offset: message.offset,
				value: message.value.toString(), // Log the message value
			})
		},
	})
}

run().catch(console.error)
