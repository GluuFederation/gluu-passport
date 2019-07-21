const
	reqp = require('request-promise'),
	parsers = require('www-authenticate').parsers,
	R = require('ramda'),
	uuid = require('uuid'),
	misc = require('./misc'),
	logger = require("./logging")

var rpt

function getConfiguration(url) {

	logger.log2('verbose', 'getConfiguration called')
    let headers = {}
    if (rpt) {
		headers.authorization = 'Bearer ' + rpt.access_token
        headers.pct = rpt.pct
    }
    let options = {
		simple: false,
		resolveWithFullResponse: true,
		headers: headers,
        uri: url
	}
	return reqp(options)
		.then(response => {
				switch (response.statusCode) {
					case 401:
						let parsed = new parsers.WWW_Authenticate(response.headers['www-authenticate'])
						logger.log2('verbose', 'getConfiguration. Got www-authenticate in header with ticket %s', parsed.parms.ticket)
						return parsed.parms
					break
					case 200:
						logger.log2('info', 'getConfiguration. Passport configs received')
						logger.log2('silly', `getConfiguration. Passport configs are: ${response.body}`)
						return JSON.parse(response.body)
					break
					default:
						throw new Error(`Received unexpected HTTP status code of ${response.statusCode}`)
				}
			})

}

function getTokenEndpoint(umaConfigURL) {

	logger.log2('verbose', 'getTokenEndpoint called')
	return reqp({ uri: umaConfigURL, json: true })
		.then(obj => {
				let endpoint = obj.token_endpoint
				if (endpoint) {
					logger.log2('info', 'getTokenEndpoint. Found endpoint at %s', endpoint)
					return endpoint
				} else {
					logger.log2('error', 'getTokenEndpoint. No token endpoint was found')
					throw new Error(msg)
				}
			})
}

function getRPT(ticket, token_endpoint) {

	logger.log2('verbose', 'getRPT called')
	let
		clientId = global.basicConfig.clientId,
    	now = new Date().getTime(),
		token = misc.getRpJWT({
					iss: clientId,
					sub: clientId,
					aud: token_endpoint,
					jti: uuid(),
					exp: now / 1000 + 30,
					iat: now
				}),
		options = {
			method: 'POST',
			uri: token_endpoint,
			json: true,
			form: {
				grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
				client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
				client_assertion: token,
				client_id: clientId,
				ticket: ticket
			}
		}

	return reqp(options)
			.then(rptDetails => {
					logger.log2('info', 'getRPT. RPT details were received')
					logger.log2('debug', `getRPT. Access token is ${rptDetails.access_token}`)
					return rptDetails
				})

}

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

function retrieveWithUMA(cfgEndpoint, val) {

	if (misc.hasData(['ticket', 'as_uri'], val)) {

		let getRPT_ = R.curry(getRPT),
			chain = misc.pipePromise(
						getTokenEndpoint,
						getRPT_(val.ticket),
						token => {
							//update global variable
							rpt = token
							//return value useful for next function in the chain
							return cfgEndpoint
						},
						getConfiguration
					)

		return chain(val.as_uri)
				.catch(e => {
						logger.log2('error', 'retrieveWithUMA. No RPT token could be obtained')
						throw e
					})
	} else {
		logger.log2('info', 'Configuration data received')
		return val
	}

}

/**
 * @sig String -> Promise Object
 */
function retrieve(cfgEndpoint) {

	let fn = R.curry(retrieveWithUMA),
		chain = misc.pipePromise(
						getConfiguration,
						fn(cfgEndpoint),
						validate
					)
	return chain(cfgEndpoint)

}

module.exports = {
	retrieve: retrieve
}
