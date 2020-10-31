const passport = require('passport')
const R = require('ramda')
const meta = require('./sp-meta')
const misc = require('./utils/misc')
const logger = require('./utils/logging')
const pparams = require('./extra-passport-params')
const cacheProvider = require('./cache-provider')
// oiclienth = require('./utils/openid-client-helper')

var prevConfigHash = 0

// These are the (node) strategies loaded so far: [{id: "...", Strategy: ...}, ... ]
var passportStrategies = []

function applyMapping (profile, provider) {
  let mappedProfile
  try {
    const mapping = global.providers.find(providerObj => providerObj.id === provider).mapping
    const additionalParams = profile.extras

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

function getVerifyFunction (prv) {
  const arity = prv.verifyCallbackArity

  const uncurried = (...args) => {
    // profile and callback are the last 2 params in all passport verify functions,
    // except for passport-openidconnect which does not follow this convention
    let profile, extras

    if (prv.passportStrategyId === 'passport-openidconnect') {
      // Check passport-openidconnect/lib/strategy.js
      const index = prv.options.passReqToCallback ? 1 : 0

      profile = args[2 + index]
      extras = args.slice(0, 2 + index)
      extras = extras.concat(args.slice(3 + index, arity - 1))
    } else {
      profile = args[arity - 2]
      extras = args.slice(0, arity - 2)
    }
    const cb = args[arity - 1]
    profile.providerKey = prv.id
    profile.extras = extras

    return cb(null, profile)
  }

  // guarantee the function has the arity required
  return R.curryN(arity, uncurried)
}

function setupStrategy (prv) {
  logger.log2('info', `Setting up strategy for provider ${prv.displayName}`)
  logger.log2('debug', `Provider data is\n${JSON.stringify(prv, null, 4)}`)

  const id = prv.id
  const moduleId = prv.passportStrategyId
  let Strategy = passportStrategies.find(strategyObj => strategyObj.id === id)

  // if module is not found, load it
  if (Strategy) {
    Strategy = Strategy.Strategy
  } else {
    logger.log2('info', `Loading node module ${moduleId}`)
    Strategy = require(moduleId)
    Strategy = (prv.type === 'oauth' && Strategy.OAuth2Strategy) ? Strategy.OAuth2Strategy : Strategy.Strategy

    logger.log2('verbose', 'Adding to list of known strategies')
    passportStrategies.push({ id, Strategy })
  }

  const options = prv.options
  const isSaml = moduleId === 'passport-saml'
  const verify = getVerifyFunction(prv)

  // Create strategy
  if (isSaml) {
    // Turn off inResponseTo validation if the IDP is configured for IDP-initiated:
    // "an IDP would never do both IDP initiated and SP initiated..."
    if (R.find(R.propEq('provider', id), global.iiconfig.authorizationParams)) {
      options.validateInResponseTo = false
    }

    // Instantiate custom cache provider if required
    if (options.validateInResponseTo) {
      const f = R.anyPass([R.isNil, R.isEmpty])
      const exp = options.requestIdExpirationPeriodMs / 1000

      if (!f(options.redisCacheOptions)) {
        options.cacheProvider = cacheProvider.get('redis', options.redisCacheOptions, exp)
      } else if (!f(options.memcachedCacheOptions)) {
        options.cacheProvider = cacheProvider.get('memcached', options.memcachedCacheOptions, exp)
      }
    }

    const samlStrategy = new Strategy(options, verify)
    passport.use(id, samlStrategy)
    meta.generate(prv, samlStrategy)
  } else {
    passport.use(id, new Strategy(options, verify))
  }
}

function parseProp (value) {
  try {
    if (typeof value === 'string') {
      value = JSON.parse(value)
    }
  } catch (err) {
    // not an error. For datatypes other than string,
    // the original parameter value is returned

  }
  return value
}

function fixDataTypes (ps) {
  for (const p of ps) {
    // The subproperties of provider's options potentially come from the server as strings, they should
    // be converted to other types if possible
    let prop = 'options'; let value = p[prop]

    if (misc.isObject(value)) {
      R.forEach((key) => {
        value[key] = parseProp(value[key])
      }, R.keys(value))
    } else {
      logger.log2('warn', `Object expected for property ${prop}, found ${JSON.stringify(value)}`)
      value = {}
    }
    p[prop] = value

    // Tries to convert passportAuthnParams to a dictionary, otherwise {} is left
    prop = 'passportAuthnParams'
    value = parseProp(p[prop])
    if (!misc.isObject(value)) {
      // log message only if passportAuthnParams is not absent
      if (!R.isNil(value)) {
        logger.log2('warn', `Parsable object expected for property ${prop}, found ${JSON.stringify(value)}`)
      }
      value = {}
    }
    p[prop] = value
  }
}

function mergeProperty (strategyId, obj, prop) {
  const extraParams = pparams.get(strategyId, prop)
  return R.mergeLeft(obj[prop], extraParams)
}

function fillMissingData (ps) {
  const paramsToFill = ['passportAuthnParams', 'options']

  // eslint-disable-next-line no-return-assign
  R.forEach(p => R.forEach(prop => p[prop] = mergeProperty(p.passportStrategyId, p, prop), paramsToFill), ps)

  for (const p of ps) {
    const options = p.options
    const strategyId = p.passportStrategyId
    const isSaml = strategyId === 'passport-saml'
    const callbackUrl = R.defaultTo(options.callbackUrl, options.callbackURL)
    const prefix = global.config.serverURI + '/passport/auth'

    if (isSaml) {
      // Different casing in saml
      options.callbackUrl = R.defaultTo(`${prefix}/saml/${p.id}/callback`, callbackUrl)
    } else {
      options.callbackURL = R.defaultTo(`${prefix}/${p.id}/callback`, callbackUrl)
      // Some passport strategies expect consumer* instead of client*
      options.consumerKey = options.clientID
      options.consumerSecret = options.clientSecret
      // Allow state validation in passport-oauth2 based strategies
      options.state = true
    }

    // Strategies with "special" treatments
    if (strategyId.indexOf('passport-apple') >= 0 && options.key) {
      // Smells like apple...
      try {
        // TODO: we have to make the UI fields multiline so they can paste the contents and avoid this
        options.key = require('fs').readFileSync(options.key, 'utf8')
      } catch (e) {
        logger.log2('warn', `There was a problem reading file ${options.key}. Ensure the file exists and is readable`)
        logger.log2('error', e.stack)
        options.key = ''
      }
    }
    /*
    //Disabled temporarily: strategy failing to validate id_tokens, see issue #78
    else if (strategyId == 'openid-client') {
      options.redirect_uri = options.callbackURL
      options = oiclienth.makeOptions(options)
      p.options = options
    }
    */

    // Fills verifyCallbackArity (number expected)
    const prop = 'verifyCallbackArity'
    const value = pparams.get(strategyId, prop)
    const toadd = options.passReqToCallback ? 1 : 0

    // In most passport strategies the verify callback has arity 4 except for saml
    p[prop] = (typeof value === 'number') ? value : (toadd + (isSaml ? 2 : 4))
  }
}

/**
 * Setup providers and sets global `providers`
 * @param ps : Object containing providers (fetched from config endpoint)
 */
function setup (ps) {
  ps = R.defaultTo([], ps)
  const h = misc.hash(ps)
  if (h !== prevConfigHash) {
    // Only makes recomputations if config data changed
    logger.log2('info', 'Reconfiguring providers')

    prevConfigHash = h
    // Unuse all strategies before reconfiguring
    R.forEach(s => passport.unuse(s), R.map(R.prop('id'), passportStrategies))

    const providers = R.clone(ps)
    // "Fix" incoming data
    fixDataTypes(providers)
    fillMissingData(providers)

    R.forEach(setupStrategy, providers)
    // Needed for routes.js
    global.providers = providers
  }
}

module.exports = {
  setup: setup,
  applyMapping: applyMapping
}
