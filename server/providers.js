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

function applyMapping(profile, provider) {

	let mappedProfile
	try {
		let mapping = R.find(R.propEq('id', provider), global.providers).mapping,
			additionalParams = profile.extras

		delete profile.extras
		logger.log2('silly', `Raw profile is ${JSON.stringify(profile._json)}`)
		logger.log2('info', `Applying mapping '${mapping}' to profile`)

		mappedProfile = require('./mappings/' + mapping)(profile, additionalParams)
		logger.log2('debug', `Resulting profile data is\n${JSON.stringify(mappedProfile, null, 4)}`)
	} catch (err) {
		logger.log2('error', `An error occurred: ${err}`)
	}
	return mappedProfile

}

function getVerifyFunction(prv) {

	let arity = prv.verifyCallbackArity

	let uncurried = (...args) => {
		//profile and callback are the last 2 params in all passport verify functions,
		//except for passport-openidconnect which does not follow this convention
		let profile, extras, cb

		if (prv.passportStrategyId == 'passport-openidconnect') {
			//Check passport-openidconnect/lib/strategy.js
			let index = prv.options.passReqToCallback ? 1 : 0

			profile = args[2 + index]
			extras = args.slice(0, 2 + index)
			extras = extras.concat(args.slice(3 + index, arity - 1))
		} else {
			profile = args[arity - 2]
			extras = args.slice(0, arity - 2)
		}
		cb = args[arity - 1]
		profile.providerKey = prv.id
		profile.extras = extras

		return cb(null, profile)
	}

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
		verify = getVerifyFunction(prv)

	//Create strategy
	if (isSaml) {
		let	f = R.anyPass([R.isNil, R.isEmpty])

		//Instantiate custom cache provider if required
		if (options.validateInResponseTo) {
			let exp = options.requestIdExpirationPeriodMs / 1000

			if (!f(options.redisCacheOptions)) {
				options.cacheProvider = cacheProvider.get('redis', options.redisCacheOptions, exp)
			} else if (!f(options.memcachedCacheOptions)) {
				options.cacheProvider = cacheProvider.get('memcached', options.memcachedCacheOptions, exp)
			}
		}
		let samlStrategy = new strategy(options, verify)
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
			strategyId = p.passportStrategyId,
			isSaml = strategyId == "passport-saml",
			callbackUrl = R.defaultTo(options.callbackUrl, options.callbackURL),
			prefix = global.config.serverURI + '/passport/auth'

		if (isSaml) {
			//Different casing in saml
			options.callbackUrl = R.defaultTo(`${prefix}/saml/${p.id}/callback`, callbackUrl)
		} else {
			options.callbackURL = R.defaultTo(`${prefix}/${p.id}/callback`, callbackUrl)
			//Some passport strategies expect consumer* instead of client*
			options.consumerKey = options.clientID
			options.consumerSecret = options.clientSecret
		}
		if (strategyId.indexOf('passport-apple') >= 0 && options.key) {
			//Smells like apple...
			try {
				//TODO: we have to make the UI fields multiline so they can paste the contents and avoid this
				options.key = require('fs').readFileSync(options.key, 'utf8')
			} catch (e) {
				logger.log2('warn', `There was a problem reading file ${options.key}. Ensure the file exists and is readable`)
				logger.log2('error', e.stack)
				options.key = ''
			}
		}

		//Fills verifyCallbackArity (number expected)
		let prop = 'verifyCallbackArity',
			value = pparams.get(strategyId, prop),
			toadd = options.passReqToCallback ? 1 : 0

		//In most passport strategies the verify callback has arity 4 except for saml
		p[prop] = (typeof value == 'number') ? value : (toadd + (isSaml ? 2 : 4))
	}

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

		R.forEach(setupStrategy, providers)
		//Needed for routes.js
		global.providers = providers
	}

}

module.exports = {
	setup: setup,
	applyMapping: applyMapping
}
