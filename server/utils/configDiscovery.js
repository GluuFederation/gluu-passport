const
	misc = require('./misc'),
	logger = require("./logging"),
	uma = require('./uma')

function validate(data) {

	//Perform a shallow validation on configuration data gathered
	let paths = [['conf', 'logging', 'level'], ['conf', 'serverWebPort']]

	if (misc.pathsHaveData(paths, data) && Array.isArray(data.providers)) {
		logger.log2('info', 'Configuration data has been parsed')
		return data
	} else {
		throw new Error('Received data not in the expected format')
	}

}

function retrieve(cfgEndpoint){

	let options = {
		simple: false,
		resolveWithFullResponse: true,
        uri: cfgEndpoint
	}
	let	chain = misc.pipePromise(
					uma.request,
					validate
				)
	return chain(options)

}

module.exports = {
	retrieve: retrieve
}
