const
	reqp = require('request-promise'),
	parsers = require('www-authenticate').parsers,
	R = require('ramda'),
	uuid = require('uuid'),
	misc = require('./misc'),
	logger = require('./logging')

var rpt

function getTokenEndpoint(umaConfigURL) {

	logger.log2('verbose', 'getTokenEndpoint called for ' + umaConfigURL)
	return reqp({ uri: umaConfigURL, json: true })
		.then(obj => {
			logger.log2('debug', `getTokenEndpoint. obj = ${JSON.stringify(obj)}`)
			let endpoint = obj.token_endpoint
			if (endpoint) {
				logger.log2('info', 'getTokenEndpoint. Found endpoint at %s', endpoint)
				return endpoint
			} else {
				let msg = 'getTokenEndpoint. No token endpoint was found'
				logger.log2('error', msg)
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
	logger.log2('debug',`getRPT request options = ${JSON.stringify(options,null,4)}`)
	return reqp(options)
		.then(rptDetails => {
			logger.log2('debug', `getRPT. response: ${JSON.stringify(rptDetails,null,4)}`)
			logger.log2('info', 'getRPT. RPT details were received')
			logger.log2('debug', `getRPT. Access token is ${rptDetails.access_token}`)
			return rptDetails
		})

}

function doRequest(options) {
	if (rpt) {
		let headers = {
			authorization: `Bearer ${rpt.access_token}`,
			pct: rpt.pct
		}
		options.headers = R.mergeRight(options.headers, headers)
	}
	logger.log2('debug', `doRequest. options = ${JSON.stringify(options,null,4)}`)
	return reqp(options)
		.then(response => {
			logger.log2('debug',`doRequest. response is: ${JSON.stringify(response,null,4)} `)
			switch (response.statusCode) {
			case 401: {
				let parsed = new parsers.WWW_Authenticate(response.headers['www-authenticate'])
				logger.log2('verbose', `getConfiguration. Got www-authenticate in header with ticket ${parsed.parms.ticket}`)
				logger.log2('debug', `getConfiguration. Reponse Headers ${JSON.stringify(response.headers,null,4)}`)
				logger.log2('debug', `getConfiguration. parsed.params = ${parsed.params}`)
				return parsed.parms
			}
			case 200: {
				logger.log2('info', 'getConfiguration. Passport configs received')
				logger.log2('debug', `getConfiguration. Passport configs are: ${response.body}`)
				return JSON.parse(response.body)
			}
			default: {
				throw new Error(`Received unexpected HTTP status code of ${response.statusCode}`)
			}
			}
		})
}

function processUnauthorized(ticket, as_uri, options) {

	let getRPT_ = R.curry(getRPT),
		chain = misc.pipePromise(
			getTokenEndpoint,
			getRPT_(ticket),
			token => {
				//update global variable
				rpt = token
				//return value useful for next function in the chain
				return options
			},
			doRequest
		)

	return chain(as_uri)
		.catch(e => {
			logger.log2('error', 'processUnauthorized. No RPT token could be obtained')
			throw e
		})

}

function request(options) {

	let fn = val => {
		if (misc.hasData(['ticket', 'as_uri'], val)) {
			return processUnauthorized(val.ticket, val.as_uri, options)

		} else {
			logger.log2('info', 'Response received')
			return val
		}
	}

	let	chain = misc.pipePromise(
		doRequest,
		fn
	)

	return chain(options)

}

module.exports = {
	request: request
}
