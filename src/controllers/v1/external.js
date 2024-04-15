const externalServices = require('@services/external')
module.exports = class External {
	async create(req) {
		try {
			return await externalServices.create(req.decodedToken)
		} catch (error) {
			console.log(error)
			return error
		}
	}
}
