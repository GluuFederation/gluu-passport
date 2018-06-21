var request = require('request-promise')
var uuid = require('uuid')

var configureStrategies = require('./configureStrategies')
var logger = require('../utils/logger')
var misc = require('../utils/misc')
var www_authenticate = require('www-authenticate')
var parsers = require('www-authenticate').parsers

var Promise = require("bluebird")
var readFile = Promise.promisify(require('fs').readFile)

var rpt

function reloadConfiguration(processUnauthorizedResponse) {

	getStrategies(global.config.passportConfigAPI)
		.then(obj => {
				if (obj.ticket && obj.as_uri) {
					if (processUnauthorizedResponse) {
						//No need to return here
						processAuthorization(obj.ticket, obj.as_uri)
					} else {
						throw new Error('reloadConfiguration. Received a response with ticket. Expecting actual URL contents')
					}
				} else {
					try {
						configureStrategies.setConfigurations(obj)
						logger.log2('info', 'reloadConfiguration. Passport strategies have been parsed')
					} catch (err) {
						logger.log2('error', err.toString())
					}
				}
			})
		.catch(e => {
				//In most cases, error caught here is caused by oxauth/oxtrust not being ready yet
				logger.log2('warn', e.toString())
				logger.log2('info', 'An attempt to get passport configurations will be tried again soon')
			})

}

function getStrategies(strategiesURL) {
	logger.log2('verbose', 'getStrategies called')
    var headers = {}
    if (rpt) {
		headers.authorization = 'Bearer ' + rpt.access_token
        headers.pct = rpt.pct
    }
    var options = {
		simple: false,
		resolveWithFullResponse: true,
		headers: headers,
        method: 'GET',
        url: strategiesURL
	}
	return request(options)
		.then(response => {
				var msg

				switch (response.statusCode) {
					case 401:
						var parsed = new parsers.WWW_Authenticate(response.headers['www-authenticate'])
						logger.log2('verbose', 'getStrategies. Got www-authenticate in header with ticket %s', parsed.parms.ticket)
						return parsed.parms
					break;
					case 200:
						logger.log2('info', 'getStrategies. Passport strategies were received')
						logger.log2('verbose', 'getStrategies. Content: %s', response.body)
						return JSON.parse(response.body)
					break;
					default:
						msg = 'Received unexpected HTTP status code of ' + response.statusCode
						throw new Error(msg)
				}
			})

}

function processAuthorization(ticket, as_uri) {
	//NOTE: this function does not need to return anything
	logger.log2('verbose', 'processAuthorization called')

	getTokenEndpoint(as_uri)
		.then(endpoint => getRPT(endpoint, ticket))
		.then(token => {
				//update global variable
				rpt = token
				//Attempt again without further 401 error handling
				reloadConfiguration(false)
			})
		.catch(e => {
			logger.log2('error', e.toString())
			logger.log2('error', 'processAuthorization. No RPT token could be obtained. An attempt to get passport configurations will be tried again soon')
		})

}

function getTokenEndpoint(UMAConfigURL) {
	logger.log2('verbose', 'getTokenEndpoint called')
	return request.get(UMAConfigURL)
		.then(urlContents => {
				var endpoint = JSON.parse(urlContents).token_endpoint
				if (endpoint) {
					logger.log2('info', 'getTokenEndpoint. Found endpoint at %s', endpoint)
					return endpoint
				} else {
					logger.log2('error', 'getTokenEndpoint. No token endpoint was found')
					throw new Error(msg)
				}
			})
}

function getRPT(token_endpoint, ticket) {
	logger.log2('verbose', 'getRPT called')
	var clientId = global.config.clientId
    var now = new Date().getTime()
	var token = misc.getJWT({
					iss: clientId,
					sub: clientId,
					aud: token_endpoint,
					jti: uuid(),
					exp: now / 1000 + 30,
					iat: now
				})

	var options = {
		method: 'POST',
		url: token_endpoint,
		form: {
			grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
			scope: 'uma_authorization',
			client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			client_assertion: token,
			client_id: clientId,
			ticket: ticket
		}
	}

	return request(options)
			.then(rptDetails => {
					logger.log2('info', 'getRPT. RPT details were received')
					var rpt = JSON.parse(rptDetails)

					logger.log2('info', 'getRPT. RPT contents parsed')

					return rpt
				})

}

exports.reloadConfiguration = reloadConfiguration
