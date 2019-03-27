const
	passport = require('passport'),
	R = require('ramda'),
	meta = require('./sp-meta'),
	misc = require('./utils/misc'),
	logger = require('./utils/logging'),
	pparams = require('./extra-passport-params')

var prevConfigHash = 0

//These are the (node) strategies loaded so far: [{id: "...", strategy: ...}, ... ]
var passportStrategies = []

function processProfile(provider, profile, done, extra) {

	let mappedProfile
	try {
		let mapping = provider.mapping
		logger.log2('silly', `Raw profile is ${JSON.stringify(profile._json)}`)
		logger.log2('info', `Applying mapping '${mapping}' to profile`)

		mappedProfile = require('./mappings/' + mapping)(profile)
		mappedProfile = R.mergeLeft(mappedProfile, extra)
	} catch (err) {
		logger.log2('error', `An error occurred: ${err}`)
		mappedProfile = {}
	}
	logger.log2('debug', `Resulting profile data is\n${JSON.stringify(mappedProfile, null, 4)}`)
	return done(null, mappedProfile)

}

function setupStrategy(prv) {

	logger.log2('info', `Setting up strategy for provider ${prv.displayName}`)
	logger.log2('debug', `Provider data is\n${JSON.stringify(prv, null, 4)}`)

	//if module is not found, load it
	let id = prv.id,
		moduleId = prv.passportStrategyId,
		strategy = R.find(R.propEq('id', id), passportStrategies)

	if (strategy) {
		strategy = strategy.strategy
	} else {
		logger.log2('info', `Loading node module ${moduleId}`)
		strategy = require(moduleId)
		strategy = (prv.type == 'oauth' && strategy.OAuth2Strategy) ? strategy.OAuth2Strategy : strategy.Strategy
		logger.log2('verbose', 'Adding to list of known strategies')
		passportStrategies.push({ id: id, strategy: strategy })
	}

	//Create strategy
	if (moduleId == 'passport-saml') {

		let samlStrategy = new strategy(
			prv.options,
			(profile, cb) => processProfile(prv, profile, cb, { provider: id, getAssertion: profile.getAssertion })
		)
		passport.use(id, samlStrategy)
		meta.generate(prv, samlStrategy)

	} else {
		passport.use(id, new strategy(
			prv.options,
			(dummy, dummy2, profile, cb) => processProfile(prv, profile, cb, { provider: id })
		))
	}

}

function parseProp(value) {

	try {
		if (typeof value == 'string') {
			value = JSON.parse(value)
		}
	} catch (e) {
	}
	return value

}

function fixDataTypes(ps) {

	for (let p of ps) {
		//The subproperties of provider's options potentially come from the server as strings, they should
		//be converted to other types if possible
		let prop = 'options', value = p[prop]

		if (misc.isObject(value)) {
			R.forEach(key => value[key] = parseProp(value[key]), R.keys(value))
		} else {
			logger.log2('warn', `Object expected for property ${prop}, found ${JSON.stringify(value)}`)
			value = {}
		}
		p[prop] = value

		//Tries to convert passportAuthnParams to a dictionary, otherwise {} is left
		prop = 'passportAuthnParams'
		value = parseProp(p[prop])
		if (!misc.isObject(value)) {
			//log message only if passportAuthnParams is not absent
			if (!R.isNil(value)) {
				logger.log2('warn', `Parsable object expected for property ${prop}, found ${JSON.stringify(value)}`)
			}
			value = {}
		}
		p[prop] = value
	}

}

function mergeProperty(strategyId, obj, prop) {
	let extraParams = pparams.get(strategyId, prop)
	return R.mergeLeft(obj[prop], extraParams)
}

function fillMissingData(ps) {

	let paramsToFill = ['passportAuthnParams', 'options']

	R.forEach(p => R.forEach(prop => p[prop] = mergeProperty(p.passportStrategyId, p, prop), paramsToFill), ps)

	for (let p of ps) {
		let options = p.options,
			callbackUrl = R.defaultTo(options.callbackUrl, options.callbackURL),
			prefix = global.config.serverURI + '/passport/auth'

		if (p.passportStrategyId == "passport-saml") {
			//Different casing in saml
			options.callbackUrl = R.defaultTo(`${prefix}/saml/${p.id}/callback`, callbackUrl)
		} else {
			options.callbackURL = R.defaultTo(`${prefix}/${p.id}/callback`, callbackUrl)
			//Some passport strategies expect consumer* instead of client*
			options.consumerKey = options.clientID
			options.consumerSecret = options.clientSecret
		}
	}

}

//Applies a few validations upon providers configuration, returns the ones passing the check
function validProviders(ps) {

	for (let p of ps) {
		let pass = false, id = p.id
		if (p.enabled && id) {

			logger.log2('info', `Validating ${id}`)
			let props = []

			if (p.passportStrategyId == 'passport-saml') {
				props = ['cert']
			} else if (p.passportStrategyId == 'passport-openidconnect') {
				props = ['clientID', 'clientSecret', 'issuer', 'authorizationURL', 'tokenURL', 'userInfoURL']
			} else if (p.passportStrategyId == 'passport-oxd'){
				props = ['clientID', 'clientSecret', 'oxdID', 'issuer', 'oxdServer']
			} else if (p.type == 'oauth') {
				props = ['clientID', 'clientSecret']
			}

			if (misc.hasData(props, p.options)) {
				pass = true
			} else {
				logger.log2('warn', `Some of ${props} are missing for provider ${id}`)
			}
		}
		if (!pass) {
			logger.log2('warn', `Provider ${id} - ${p.displayName} is disabled`)
			p.enabled = false
		}
	}
	//Get rid of disabled ones
	return R.filter(R.prop('enabled'), ps)

}

function setup(ps) {

	ps = R.defaultTo([], ps)
	let h = misc.hash(ps)
	if (h != prevConfigHash) {
		//Only makes recomputations if config data changed
		logger.log2('info', 'Reconfiguring providers')

		prevConfigHash = h
		//Unuse all strategies before reconfiguring
		R.forEach(s => passport.unuse(s), R.map(R.prop('id'), passportStrategies))

		let providers = R.clone(ps)
		//"Fix" incoming data
		fixDataTypes(providers)
		fillMissingData(providers)
		providers = validProviders(providers)

		R.forEach(setupStrategy, providers)
		//Needed for routes.js
		global.providers = providers
	}

}

module.exports = {
	setup: setup
}
