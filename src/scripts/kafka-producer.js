const { Kafka } = require('kafkajs')

// Create a Kafka instance
const kafka = new Kafka({
	clientId: 'mentoring',
	brokers: ['10.175.3.38:9092'], // Replace with your Kafka broker(s)
})

// Create a producer instance
const producer = kafka.producer()

const run = async () => {
	// Connect the producer to the Kafka broker
	await producer.connect()

	// Prepare a JSON message
	const message = {
		id: 1,
		title: 'Test Message',
		content: 'This is a test message in JSON format',
		timestamp: new Date().toISOString(),
	}

	try {
		// Send the message to a specific topic
		let output = await producer.send({
			topic: 'dev.mentoring.notifications', // Replace with your Kafka topic name
			messages: [
				{ value: JSON.stringify(message) }, // Convert JSON object to string
			],
		})

		console.log(output)

		console.log('Message sent successfully')
	} catch (err) {
		console.error('Failed to send message', err)
	} finally {
		// Disconnect the producer
		await producer.disconnect()
	}
}

// Run the producer
run().catch(console.error)
