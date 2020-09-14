const reqp = require('request-promise')
const parsers = require('www-authenticate').parsers
const R = require('ramda')
const uuid = require('uuid')
const misc = require('./misc')
const logger = require('./logging')

var rpt

/**
 * @todo: Add proxy option for dev/tests
 */
// const reqp = reqp.defaults({
// proxy: 'http://127.0.0.1:9234'
// })

function getTokenEndpoint (umaConfigURL) {
  logger.log2('verbose', 'getTokenEndpoint called for ' + umaConfigURL)
  return reqp({ uri: umaConfigURL, json: true })
    .then(obj => {
      logger.log2(
        'debug',
        `getTokenEndpoint. obj = ${JSON.stringify(obj)}`
      )
      const endpoint = obj.token_endpoint
      if (endpoint) {
        logger.log2(
          'info',
          `getTokenEndpoint. Found endpoint at ${endpoint}`)
        return endpoint
      } else {
        const msg = 'getTokenEndpoint. No token endpoint was found'
        logger.log2('error', msg)
        throw new Error(msg)
      }
    })
}

/**
 * Request RP Token (RPT) from token endpoint and returns response
 * @param ticket : String ticket received on 401 first response
 * @param tokenEndpoint : String token endpoint received on 401
 * @returns {PromiseLike<options> | Promise<response>}
 */
function getRPT (ticket, tokenEndpoint) {
  logger.log2('verbose', 'getRPT called')
  const
    clientId = global.basicConfig.clientId
  const now = new Date().getTime()
  const token = misc.getRpJWT({
    iss: clientId,
    sub: clientId,
    aud: tokenEndpoint,
    jti: uuid(),
    exp: now / 1000 + 30,
    iat: now
  })
  const options = {
    method: 'POST',
    uri: tokenEndpoint,
    json: true,
    form: {
      grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
      client_assertion_type:
          'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: token,
      client_id: clientId,
      ticket: ticket
    }
  }
  logger.log2(
    'debug', `getRPT request options = ${JSON.stringify(
      options, null, 4)}`
  )
  return reqp(options)
    .then(rptDetails => {
      logger.log2(
        'debug', `getRPT. response: ${JSON.stringify(
          rptDetails, null, 4)}`)
      logger.log2('info', 'getRPT. RPT details were received')
      logger.log2(
        'debug',
        `getRPT. Access token is ${rptDetails.access_token}`)
      return rptDetails
    })
}

/**
 * Do UMA requests and handle response according to UMA Flow.
 * @param options : Object containing UMA request options
 * @returns {PromiseLike<options> | Promise<response>}
 */
function doRequest (options) {
  // if RPT was already fetched
  if (rpt) {
    const headers = {
      authorization: `Bearer ${rpt.access_token}`,
      pct: rpt.pct
    }
    options.headers = R.mergeRight(options.headers, headers)
  }

  logger.log2(
    'debug', `doRequest. options = ${JSON.stringify(
      options, null, 4)}`
  )
  return reqp(options)
    .then(response => {
      logger.log2(
        'debug',
        `doRequest. response is: ${JSON.stringify(
          response, null, 4)}`
      )
      switch (response.statusCode) {
        // usually first response, without RPT
        case 401: {
          const parsed = new parsers.WWW_Authenticate(
            response.headers['www-authenticate']
          )
          logger.log2(
            'verbose',
            'getConfiguration. Got www-authenticate in header' +
          `with ticket ${parsed.parms.ticket}`)
          logger.log2('debug',
          `getConfiguration. Reponse Headers ${JSON.stringify(
            response.headers, null, 4)}`
          )
          logger.log2('debug',
          `getConfiguration. parsed.params = ${parsed.params}`
          )
          // return this as val to function(val) inside request
          return parsed.parms
        }

        // success response when RPT already fetched (exists)
        case 200: {
          logger.log2(
            'info', 'getConfiguration. Passport configs received'
          )
          logger.log2(
            'debug',
          `getConfiguration. Passport configs are: ${response.body}`
          )
          // return this as val to function(val) inside request
          return JSON.parse(response.body)
        }
        default: {
          throw new Error(
            'Received unexpected HTTP status code ' +
          `of ${response.statusCode}`
          )
        }
      }
    })
}

/**
 *
 * @param ticket : String - ticket from 401 response
 * @param asUri : String - asUri from 401 response
 * @param options : Object containing UMA request options
 * @returns {Promise<any>}
 */
function processUnauthorized (ticket, asUri, options) {
  const getRPT_ = R.curry(getRPT)
  const chain = misc.pipePromise(
    getTokenEndpoint,
    getRPT_(ticket),
    token => {
      // update global variable
      rpt = token
      // return value useful for next function in the chain
      return options
    },
    doRequest
  )

  return chain(asUri)
    .catch(e => {
      logger.log2(
        'error',
        'processUnauthorized. No RPT token could be obtained'
      )
      throw e
    })
}

/**
 * call doRequest passing options as param
 * take that result and call fn with that value
 * return the result
 * @param options : Object containing UMA request options
 * @returns {*}
 */
function request (options) {
  // function to handle doRequest return
  const fn = function (val) {
    // if it's unauthorized (has ticket and as_uri)
    if (misc.hasData(['ticket', 'as_uri'], val)) {
      return processUnauthorized(val.ticket, val.as_uri, options)
    } else {
      logger.log2('info', 'Response received')
      return val
    }
  }

  const chain = misc.pipePromise(
    doRequest,
    fn
  )

  return chain(options)
}

module.exports = {
  request: request
}
