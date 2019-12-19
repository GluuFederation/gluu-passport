const
	passport = require('passport'),
	R = require('ramda'),
	meta = require('./sp-meta'),
	misc = require('./utils/misc'),
	logger = require('./utils/logging'),
	pparams = require('./extra-passport-params'),
	cacheProvider = require('./cache-provider')

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

function getVerifyFunction(prv, isSaml) {

	let arity = prv.verifyCallbackArity,
		extraParams = (isSaml, profile, args) => {
							//Assume args.lenght==arity
							let data = { verifyCallbackArgs: args.slice(0, arity-2), provider: prv.id }
							if (isSaml) {
								//this property is added so idp-initiated code can parse the SAML assertion,
								//however it is removed from the profile sent to oxauth afterwards (see misc.arrify)
								data.getAssertionXml = profile.getAssertionXml
							}
							return data
						}

	//profile and callback are always the last 2 params in passport verify functions
	let uncurried = (...args) => processProfile(prv,
									args[arity-2],	//profile
									args[arity-1],	//cb
									extraParams(isSaml, args[arity-2], args))
	//guarantee the function has the arity required
	return R.curryN(arity, uncurried)

}

function setupStrategy(prv) {

	logger.log2('info', `Setting up strategy for provider ${prv.displayName}`)
	logger.log2('debug', `Provider data is\n${JSON.stringify(prv, null, 4)}`)

	let id = prv.id,
		moduleId = prv.passportStrategyId,
		strategy = R.find(R.propEq('id', id), passportStrategies)

	//if module is not found, load it
	if (strategy) {
		strategy = strategy.strategy
	} else {
		logger.log2('info', `Loading node module ${moduleId}`)
		strategy = require(moduleId)
		strategy = (prv.type == 'oauth' && strategy.OAuth2Strategy) ? strategy.OAuth2Strategy : strategy.Strategy

		logger.log2('verbose', 'Adding to list of known strategies')
		passportStrategies.push({ id: id, strategy: strategy })
	}

	let options = prv.options,
		isSaml = moduleId == 'passport-saml',
		verify = getVerifyFunction(prv, isSaml)

	//Create strategy
	if (isSaml) {
		let	f = R.anyPass([R.isNil, R.isEmpty]),
			samlStrategy = new strategy(options, verify)

		//Instantiate custom cache provider if required
		if (options.validateInResponseTo && !f(options.redisCacheOptions)) {
			options.cacheProvider = cacheProvider.get(options.redisCacheOptions)
		}
		passport.use(id, samlStrategy)
		meta.generate(prv, samlStrategy)

	} else {
		passport.use(id, new strategy(options, verify))
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

		//Fixes verifyCallbackArity (number expected)
		prop = 'verifyCallbackArity'
		value = p[prop]
		if (typeof value != 'number') {
			//In most passport strategies the verify callback has arity 4
			p[prop] = 4
		}
	}

}

function mergeProperty(strategyId, obj, prop) {
	let extraParams = pparams.get(strategyId, prop)
	return R.mergeLeft(obj[prop], extraParams)
}

function fillMissingData(ps) {

	let paramsToFill = ['passportAuthnParams', 'options', 'verifyCallbackArity']

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
