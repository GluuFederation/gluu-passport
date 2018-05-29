var request = require('request-promise')
var uuid = require('uuid')
var jwt = require('jsonwebtoken')

var configureStrategies = require('./configureStrategies')
var logger = require('../utils/logger')
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
						logger.info('reloadConfiguration. Passport strategies have been parsed')
					} catch (err) {
						logger.log('error', err.toString())
					}
				}
			})
		.catch(e => {
				//In most cases, error caught here is caused by oxauth/oxtrust not being ready yet
				logger.log('warn', e.toString())
				logger.sendMQMessage('warn ' + e.toString())
				logger.log('info', 'An attempt to get passport configurations will be tried again soon')
			})

}

function getStrategies(strategiesURL) {

	logger.log('debug', 'getStrategies called')
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
						msg = 'getStrategies. Got www-authenticate in header with ticket ' + parsed.parms.ticket

						logger.log('debug', msg)
						logger.sendMQMessage(msg)

						return parsed.parms
					break;
					case 200:
						msg = 'getStrategies. Passport strategies were received'
						logger.log('info', msg)
						logger.sendMQMessage(msg)

						logger.log('debug', 'getStrategies. Content: %s', response.body)
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
	logger.log('debug', 'processAuthorization called')

	getTokenEndpoint(as_uri)
		.then(endpoint => getRPT(endpoint, ticket))
		.then(token => {
				//update global variable
				rpt = token
				//Attempt again without further 401 error handling
				reloadConfiguration(false)
			})
		.catch(e => {
			var msg = e.toString()
			logger.log('error', msg)
			logger.sendMQMessage('error ' + msg)

			msg = 'processAuthorization. No RPT token could be obtained. An attempt to get passport configurations will be tried again soon'
			logger.log('error', msg)
			logger.sendMQMessage('error ' + msg)
		})

}

function getTokenEndpoint(UMAConfigURL) {

	logger.log('debug', 'getTokenEndpoint called')
	return request.get(UMAConfigURL)
		.then(urlContents => {
				var endpoint = JSON.parse(urlContents).token_endpoint
				if (endpoint) {
					logger.log('info', 'getTokenEndpoint. Found endpoint at %s', endpoint)
					return endpoint
				} else {
					var msg = "getTokenEndpoint. No token endpoint was found"
					logger.log('error', msg)
                    logger.sendMQMessage('error: ' + msg)
					throw new Error(msg)
				}
			})
}

function getRPT(token_endpoint, ticket) {

	logger.log('debug', 'getRPT called')
	return readFile(global.config.keyPath, 'utf8') 	// get private key and replace headers to sign jwt
			.then(content => content.replace("-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----")
									.replace("-----END RSA PRIVATE KEY-----", "-----END PRIVATE KEY-----")
					)
			.then(passportCert => {
					var clientId = global.config.clientId
					var token = getSignedJWT(clientId, token_endpoint, passportCert)

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
									var msg = 'getRPT. RPT details were received'
									logger.log('info', msg)
									logger.sendMQMessage('info: ' + msg)

									var rpt = JSON.parse(rptDetails)
									msg= 'getRPT. RPT contents parsed'

									logger.log('info', msg)
									logger.sendMQMessage('info: ' + msg)

									return rpt
								})
				})

}

function getSignedJWT(sub, aud, cert) {

    var options = {
        algorithm: global.config.keyAlg,
        header: {
            "typ": "JWT",
            "alg": global.config.keyAlg,
            "kid": global.config.keyId
        }
    }
    var now = new Date().getTime()

    return jwt.sign({
        iss: sub,
        sub: sub,
        aud: aud,
        jti: uuid(),
        exp: now / 1000 + 30,
        iat: now
    }, cert, options)

}

exports.reloadConfiguration = reloadConfiguration