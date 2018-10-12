const assert = require('assert')
const url = require('url')
const request = require('request-promise')
const _ = require('lodash')
const forEach = require('../utils/for_each')
const logger = require('../utils/logger')

function getAuthorizationEndpoint(openIdConfigURL) {
	logger.log2('verbose', 'getAuthorizationEndpoint called')
	return request.get(openIdConfigURL)
	.then(urlContents => {
		var endpoint = JSON.parse(urlContents).authorization_endpoint
		if (endpoint) {
			logger.log2('info', 'getAuthorizationEndpoint. Found endpoint at %s', endpoint)
			return endpoint
		} else {
			logger.log2('error', 'getAuthorizationEndpoint. No token endpoint was found')
			throw new Error(msg)
		}
	})
}

function authorizationParams(params) {
	assert(_.isPlainObject(params), 'Pass a plain object as the first argument')

	//TODO: what to use in state param?
	const authParams = Object.assign({	scope: 'openid',
										response_type: 'code',
										acr_values: 'passport_saml' }, params)

	forEach(authParams, (value, key) => {
		if (value === null || value === undefined) {
			delete authParams[key];
		} else if (key === 'claims' && typeof value === 'object') {
			authParams[key] = JSON.stringify(value);
		} else if (typeof value !== 'string') {
			authParams[key] = String(value);
		}
	})

	assert(
			['none', 'code'].includes(authParams.response_type) || authParams.nonce,
			'Nonce MUST be provided for implicit and hybrid flows'
	)

	return authParams;
}

function getAuthorizationUrl(authorization_endpoint, params) {
	const target = url.parse(authorization_endpoint, true);
	target.search = null;
	//TODO: calling authorizationParams(params) does the same as below?
	Object.assign(target.query, authorizationParams.call(this, params));
	return url.format(target);
}

module.exports.getAuthorizationEndpoint = getAuthorizationEndpoint
module.exports.getAuthorizationUrl = getAuthorizationUrl
