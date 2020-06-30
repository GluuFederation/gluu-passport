const
	R = require('ramda'),
	uuid = require('uuid'),
	url = require('url'),
	providersModule = require('./providers'),
	webutil = require('./utils/web-utils'),
	misc = require('./utils/misc'),
	logger = require('./utils/logging')

function createAuthzRequest(user, iiconfig) {

	let	provider = user.providerKey,
		req = R.find(R.propEq('provider', provider), iiconfig.authorizationParams)

	if (!req) {
		logger.log2('error', `Provider ${provider} not found in idp-initiated configuration.`)

	} else if (misc.hasData(['redirect_uri'], req)) {
		//Apply transformation to user object and restore original provider value
		user = misc.arrify(user)
		user.provider = provider

		let now = new Date().getTime(),
			clientId = iiconfig.openidclient.clientId,
			jwt = misc.getRpJWT({
				iss: global.config.serverURI,
				sub: user.uid,
				aud: clientId,
				jti: uuid(),
				exp: now / 1000 + 30,
				iat: now,
				data: misc.encrypt(user)
			})

		let extraParams = R.unless(misc.isObject, () => {}, req.extraParams)
		req = R.omit(['provider', 'extraParams'], req)

		req.state = jwt
		req.response_type = R.defaultTo('code', req.response_type)

		req.scope = R.defaultTo('openid', req.scope)
		//In case scopes come in comma-separated value style
		req.scope = R.join(' ', R.split(',', req.scope))
		req.acr_values = iiconfig.openidclient.acrValues
		req.client_id = clientId

		//Properties in extraParams will overwrite the existing ones in req
		req = R.mergeRight(req, extraParams)

		//Nonce is needed in implicit flow
		let nonceNeeded = R.anyPass(R.map(R.propEq('response_type'), ['id_token token', 'id_token']))
		if (nonceNeeded(req)) {
			req.nonce = uuid()
		}
		logger.log2('debug', `Request is\n${JSON.stringify(req, null, 4)}`)
	} else {
		req = undefined
	}
	return req

}

function process(req, res, next) {

	let	user = req.user,
		relayState = req.body.RelayState

	logger.log2('debug', `RelayState value: ${relayState}`)
	logger.log2('debug', `SAML reponse in body:\n${req.body.SAMLResponse}`)

	if (user.inResponseTo) {
		logger.log2('info', 'inResponseTo found in SAML assertion')
		//This is not an IDP-initiated request: hand in control to next middleware in the chain (see routes.js)
		next()
	} else {
		if (relayState) {
			//This cookie can be used to restore the value of relay state in the redirect_uri
			//page of the OIDC client used for this flow
			res.cookie('relayState', relayState, {
				maxAge: 20000,	//20 sec expiration
				secure: true
			})
		}

		let provider = user.providerKey,
			iiconfig = global.iiconfig

		user = providersModule.applyMapping(user, provider)
		if (!user) {
			webutil.handleError(req, res, 'User profile is empty')
			return
		}

		logger.log2('info', `User ${user.uid} authenticated with provider ${provider}`)
		//Create an openId authorization request
		logger.log2('info', 'Crafting an OIDC authorization request')

		let authzRequestData = createAuthzRequest(user, iiconfig)
		if (authzRequestData) {
			let target = url.parse(iiconfig.openidclient.authorizationEndpoint, true)
			target.search = null
			target.query = authzRequestData

			//DO the redirection
			res.redirect(url.format(target))
		} else {
			let msg = 'Not enough data to build an authorization request. At least a redirect URI is needed'
			logger.log2('error', msg)
			logger.log2('info', 'Check your configuration of inbound IDP-initiated flow in oxTrust')
			webutil.handleError(null, res, `An error occurred: ${msg}`)
		}
	}

}

module.exports = {
	process: process
}
