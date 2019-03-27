const
	R = require('ramda'),
	uuid = require('uuid'),
	url = require('url'),
	misc = require('./utils/misc'),
	logger = require("./utils/logging"),
	oxAuthCustomParam = 'IDPInitiatedFlowProfileParam'

function hasInResponseTo(user) {

	let	val = { present: false }
		ass = user.getAssertion(),	//See file lib/passport-saml/saml.js in node passport-saml library
		fns = R.prepend(
					R.prop('Assertion'),
					R.intersperse(R.head, [R.prop('Subject'), R.prop('SubjectConfirmation'), R.prop('SubjectConfirmationData'), R.prop('$')])
				)

	try {
		let confirmationData = R.apply(R.pipe, fns)(ass)
		//is InResponseTo present and has non empty value ?
		if (misc.hasData(['InResponseTo'], confirmationData)) {
			val.present = true
		}
	} catch (e) {
		logger.log2('error', 'SAML assertion does not have the path: Assertion > Subject > SubjectConfirmation > SubjectConfirmationData')
		val.error = e
	}
	return val

}

function createAuthzRequest(user, iiconfig) {

	let req = R.find(R.propEq('provider', provider), iiconfig.authorizationParams),
		provider = user.provider

	if (!req) {
		logger.log2('error', `Provider ${provider} not found in idp-initiated configuration.`)

	} else if (misc.hasData('redirect_uri', req)) {

		let now = new Date().getTime(),
			clientId = iiconfig.openidclient.clientId,
			jwt = misc.getRpJWT({
					iss: global.config.serverURI,
					sub: user.uid,
					aud: clientId,
					jti: uuid(),
					exp: now / 1000 + 30,
					iat: now,
					data: user
				})

		req = R.dissoc('provider', req)
		req.state = jwt
		req.response_type = R.defaultTo('code', req.response_type)

		req.scope = R.defaultTo('openid', req.scope)
		//In case scopes come in comma-separated value style
		req.scope = R.join(' ', R.split(',', req.scope))
		req.acr_values = iiconfig.openidclient.acrValues
		req.client_id = clientId

		//Nonce is needed in implicit flow
		let nonceNeeded = R.anyPass(R.map(R.propEq('response_type'), ['id_token token', 'id_token']))
		if (nonceNeeded(req)) {
			req.nonce = uuid()
		}
	} else {
		req = undefined
	}
	return req

}

function process(user, relayState, iiconfig, res, next) {

	//Search for "inResponseTo" in the SAML assertion, if absent, jump to IDP-initiated flow
    let irtResult = hasInResponseTo(user),
    	err = irtResult.error

    if (err) {
		res.status(500).send(`An error occurred: ${err}`)
	} else {
		if (irtResult.present) {
			logger.log2('info', 'inResponseTo found in SAML assertion')
			//This is not an IDP-initiated request: hand in control to next middleware in the chain (see routes.js)
			next()
		} else {
    		logger.log2('info', `User ${user.uid} authenticated with provider ${user.provider}`)
			logger.log2('info', 'Crafting an OIDC authorization request')

			if (relayState) {
				//This cookie can be used to restore the value of relay state in the redirect_uri
				//page of the OIDC client used for this flow
				res.cookie('relayState', relayState, {
					httpOnly: false, //true
					maxAge: 20000,	//20 sec expiration
					secure: true
				})
			}

			//Create an openId authorization request
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
				res.status(500).send(`An error occurred: ${msg}`)
			}
		}
	}

}

module.exports = {
	process: process
}
