const router = require('express').Router()
const passport = require('passport')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const idpInitiated = require('./idp-initiated')
const providersModule = require('./providers')
const webutil = require('./utils/web-utils')
const misc = require('./utils/misc')
const logger = require('./utils/logging')
const url = require('url')
const path = require('path')
const { handleStrategyError } = require('./utils/error-handler')
const got = require('got')
const appInsights = require('applicationinsights')
const { session } = require('passport')

router.get('/health-check', function (req, res) {
  return res.send({ message: 'Cool!!!', sessionCookie: req.session.cookie })
})

router.get('/error', function (req, res) {
  handleStrategyError(req, res)
})

// CATS SAML Authentication Responses use the HTTP POST binding
router.post('/auth/saml/:provider/callback',
  validateProvider,
  authenticateRequestCallback,
  idpInitiated.process,
  callbackResponse)

  // CATS SAML Logout Requests and Responses use the HTTP Redirect binding
router.get('/auth/saml/:provider/callback',
  validateProvider,
  processLogout)

router.get('/auth/:provider/callback',
  validateProvider,
  authenticateRequestCallback,
  callbackResponse)

router.post('/auth/:provider/callback',
  validateProvider,
  require('express').urlencoded({ extended: false }),
  authenticateRequestCallback,
  callbackResponse)

router.get('/auth/:provider/:token',
  validateProvider,
  validateToken,
  authenticateRequest)

router.get('/auth/:provider/:token/:authParams',
validateProvider,
validateToken,
parseParams,
authenticateRequest)

router.get('/casa/:provider/:token',
  (req, res, next) => {
    req.failureUrl = '/casa/rest/pl/account-linking/idp-linking'
    next()
  },
  validateProvider,
  validateToken,
  authenticateRequestCasa)

// Token generation
router.get('/token',
  // eslint-disable-next-line no-unused-vars
  function (req, res, next) {
    logger.log2('verbose', 'Issuing token')
    const t = misc.getJWT({ jwt: uuidv4() }, 120) // 2 min expiration
    res.status(200).send({ token_: t })
  }
)

/*
* Metadata
* @todo: receive IDP id as an int and validate
* @todo: workaround: validate idp string "id" on oxauth/db/file
*/
router.get('/auth/meta/idp/:idp',
  function (req, res) {
    // normalizes
    const idp = path.basename(req.params.idp)
    const metaFileName = `${idp}.xml`
    const safeFileFullPath = path.join(__dirname, 'idp-metadata', metaFileName)

    logger.log2('verbose', `Metadata request for IDP ${idp}`)

    // handle ENOENT
    fs.readFile(safeFileFullPath,
      (err, data) => {
        if (err) {
          if (!fs.existsSync(safeFileFullPath)) {
            const EnoentError = `Requested metadata for ${metaFileName} not found`
            logger.log2('error', EnoentError)
            res.status(404).send('Requested metadata not found')
          } else {
            res.status(500).send(`An error occurred: ${err}`)
            logger.log2('error', err)
          }
        } else {
          res.status(200).set('Content-Type', 'text/xml').send(String(data))
        }
      })
  })

// SP-initiated logout
router.get('/logout/request/:authParams', parseParams, (req, res, next) => {
  req.user = req.locals.authParams
  var strategy = passport._strategy(req.user.provider)

  if (strategy.name === 'saml' && strategy._saml.options.logoutUrl) {
    logger.log2('debug', 'SAML Logout of subject ' + JSON.stringify(req.user))
    appInsights.defaultClient.trackEvent({name: "SP-initiated Logout Request",
                                          properties: {...{provider: req.params.provider}, ...req.user}})
    strategy.logout(req, (err, uri) => {
      req.logout()
      delete req.session
      delete req.user
      res.redirect(uri)
    })
  } else {
    res.send("Success")
  }
});

// Propagate SP Logout Response
router.get('/logout/response/:status?', (req, res, next) => {
  const status = req.params.status || 'Success'
  if (!(req.user && req.user.providerKey)) {
    res.status(400).send('No Session')
  } else {
    const provider = req.user.providerKey
    var strategy = passport._strategy(provider)

    if (req.user.logoutRequest) {
      req.samlLogoutRequest = req.user.logoutRequest
      req.samlLogoutRequest.status = 'urn:oasis:names:tc:SAML:2.0:status:' + status
      strategy._saml.getLogoutResponseUrl(req, req.user.relayState, {}, (err, url) => {
        if (err) {
          webutil.handleError(req, res, err.message)
        } else {
          req.samlLogoutRequest.reason = 'Session terminated'
          appInsights.defaultClient.trackEvent({name: "IDP-Initiated Logout Response", properties: req.samlLogoutRequest})
          res.redirect(url)
        }
      })
    } else {
      res.status(400).send("No logout request to respond to!")
    }
  }
});

// Supporting functions

function validateProvider (req, res, next) {
  const provider = req.params.provider // provider is non empty here
  const providerConfData = global.providers.find(cfg => cfg.id === provider)

  if (providerConfData) {
    // Attach some info for later use
    req.passportAuthenticateParams = providerConfData.passportAuthnParams
    next()
  } else {
    webutil.handleError(
      req, res, 'The selected provider is not recognized as external identity provider')
  }
}

async function authenticateRequest (req, res, next) {
  const provider_id = req.params.provider
  logger.log2('verbose', `Authenticating request against ${provider_id}`)
  req.session.authenticating = true
  appInsights.defaultClient.trackEvent({name: "Authentication Request",
                                       properties: {...{provider: provider_id},
                                                    ...req.query, ...req.session}})
                                            
  const providerConfData = global.providers.find(cfg => cfg.id === provider_id)

  if (providerConfData.type === "openid-client") {
    const strategy = passport._strategy(provider_id)
    const client = strategy._client
    req.passportAuthenticateParams.nonce = uuidv4()

    if (client.use_request_object && client.use_request_object.toString().toLowerCase() === 'true') { // Only for clients with use_request_object set to true
      await client.requestObject(req.locals.authParams).then(function(value) {
        req.passportAuthenticateParams.request = value;
      });
    }
  }

  passport.authenticate(req.params.provider, req.passportAuthenticateParams)(req, res, next)
}

function authenticateRequestCasa (req, res, next) {
  const provider = req.params.provider

  res.cookie('casa-' + provider, 'marker cookie', {
    httpOnly: true,
    maxAge: 120000, // 2min expiration
    secure: true
  })

  logger.log2('verbose', `Proceeding with linking procedure for provider ${provider}`)
  authenticateRequest(req, res, next)
}

function authenticateRequestCallback (req, res, next) {
  logger.log2('verbose', `Authenticating request against ${req.params.provider}`)
  passport.authenticate(
    req.params.provider, { failureRedirect: '/passport/error', failureFlash: true }
  )(req, res, next)
}

function validateToken (req, res, next) {
  const t = req.params.token
  try {
    logger.log2('verbose', 'Validating token')
    misc.verifyJWT(t)
    next()
  } catch (err) {
    const msg = 'Token did not pass validation.'
    logger.log2('error', `${msg} token: ${t}, error: ${err}`)
    webutil.handleError(req, res, msg)
  }
}

function callbackResponse (req, res) {
  let postUrl
  let user = req.user
  const provider = user.providerKey

  if (req.cookies['casa-' + provider]) {
    postUrl = '/casa/rest/pl/account-linking/idp-linking/' + provider
  } else {
    postUrl = global.config.postProfileEndpoint
  }

  user = providersModule.applyMapping(user, provider)
  if (!user) {
    webutil.handleError(req, res, 'User profile is empty')
    return
  }

  const sub = user.uid
  logger.log2('info', `User ${sub} authenticated with provider ${provider}`)
  req.session.authenticating = false

  // Apply transformation to user object and restore original provider value
  user = misc.arrify(user)
  user.provider = provider

  const now = new Date().getTime()
  const jwt = misc.getRpJWT({
    iss: postUrl,
    sub: sub,
    aud: global.basicConfig.clientId,
    jti: uuidv4(),
    exp: now / 1000 + 30,
    iat: now,
    data: misc.encrypt(user)
  })

  logger.log2('debug', `Sending user data ${jwt} to: ${postUrl}`)

  res.set('content-type', 'text/html;charset=UTF-8')
  return res.status(200).send(`
    <html xmlns="http://www.w3.org/1999/xhtml">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.js"></script>
    <script type="text/javascript">
      function getLanguage() {
        $.ajax({
          url: '${global.basicConfig.languageAPI}',
          type: 'GET',
          contentType: 'application/json',
          xhrFields: {
            withCredentials: true
          },
          success: function (data) {
            var lang =  data.lang.substring(0, 2);
            document.forms[0].elements[1].value = lang;
            document.forms[0].submit();
          },
          error: function (jqXHR, textStatus, errorThrown) { console.log(errorThrown); document.forms[0].submit() }
        });
      }
    </script>
    <body onload="getLanguage()">
      <noscript>
        <p>
          <b>Note:</b> your browser does not support JavaScript, please press the Continue
          button to proceed.
        </p>
        <p>
          <b>Remarque:</b> votre navigateur ne prend pas en charge JavaScript, veuillez appuyer sur le bouton Continuer
          pour continuer.
        </p>
      </noscript>
      <img style='display:block;margin-left:auto;margin-right:auto;padding:10% 0;' src='/oxauth/ext/resources/assets/icon_flag_rotation_080x080.gif'>
      <form action="${postUrl}" method="post">
        <div>
          <input type="hidden" name="user" value="${jwt}"/>
          <input id="locale" type="hidden" name="locale"/>
          <noscript>
            <input type="submit" value="Continue / Continuer"/>
          </noscript>
        </div>
      </form>
    </body>
    </html> `
  )
}

function processLogout(req, res) {
  const validateCallback = async ({ profile, loggedOut }) => {
		logger.log2('debug', 'logout callback ' + JSON.stringify(profile) + ' ' + loggedOut)

		if (profile) { // received a Logout Request
      appInsights.defaultClient.trackEvent({name: "IDP-Initiated Logout Request", properties: profile})

      req.samlLogoutRequest = profile
			if (req.session && req.session.authenticating) { // Login is in flight. Must be Administrative SLO.
        req.samlLogoutRequest.reason = "New session"
      }
      else if (!req.session || !req.headers.cookie || !req.cookies.session_id) { // Can't find oxAuth session cookie(s). Probably blocked.
        req.samlLogoutRequest.status = 'urn:oasis:names:tc:SAML:2.0:status:Responder'
        req.samlLogoutRequest.reason = 'Session not found'
      }
      else if (req.cookies.session_id.length === 0) { // Session no longer exists
        req.samlLogoutRequest.reason = "Old session"
      }
      else {
        // Check the oxAuth session_status API
        const responsePromise = got.get(global.basicConfig.sessionStatusEndpont,
                                        {throwHttpErrors: false,
                                         headers: {cookie: 'session_id=' + req.cookies.session_id}})
        const jsonPromise = responsePromise.json()
        const [httpResponse, statusResponse] = await Promise.all([responsePromise, jsonPromise]);
        expiry = parseInt(statusResponse.custom_state)
        if (httpResponse.statusCode != 200 || statusResponse.state != 'authenticated'
             || isNaN(expiry) || expiry - Date.now() < 5000) { // Dont't risk it if session is about to expire
           req.samlLogoutRequest.reason = "Old session"
         }
      }

      logger.log2('info', 'Reason: ' + req.samlLogoutRequest.reason)
      if (req.samlLogoutRequest.reason) { // Respond immediately
				strategy._saml.getLogoutResponseUrl(req, req.query.RelayState, {}, (err, url) => {
					if (err) {
						webutil.handleError(req, res, err.message)
					} else {
            appInsights.defaultClient.trackEvent({name: "IDP-Initiated Logout Response", properties: req.samlLogoutRequest})
						res.redirect(url)
					}
				})
			} else { // Propogate logout to oxAuth
				req.user.logoutRequest = profile
        req.user.relayState = req.query.RelayState
				const redirectUri = encodeURIComponent('https://' + req.hostname + '/passport/logout/response')
				res.redirect('/oxauth/restv1/end_session?post_logout_redirect_uri=' + redirectUri)
			}
		} else { // Sending Logout Response
      appInsights.defaultClient.trackEvent({name: "SP-Initiated Logout Response", properties: profile})
			res.send("Success")
		}
	}

	const provider = req.params.provider
	logger.log2('verbose', 'received logout from provider ' + provider)
	const strategy = passport._strategy(provider)
  
  var originalQuery = url.parse(req.url).query
  strategy._saml
  .validateRedirectAsync(req.query, originalQuery)
  .then(validateCallback)
  .catch((err) => {
    logger.log2('error', err.stack) // Partial or failed Logout
    res.send(JSON.stringify(err))
  });
}

function parseParams (req, res, next) {
  const params = req.params.authParams
  try {
    if (params) {
      logger.log2('verbose', 'Parsing parameters')
      const paramsObj = misc.decrypt(params.replace('_', '/').replace('-','+'));

      if (paramsObj.exp && paramsObj.exp * 1000 <  Date.now()) {
        throw("Authentication parameters have expired.")
      }

      // Add the options to the req.locals.authParams for future use
      req.locals = {};
      req.locals.authParams = {...paramsObj};
    }
    next()
  } catch (err) {
    const msg = 'Authentication parameters were not parsed successfully'
    logger.log2('error', `${msg}, error: ${err}`)
    webutil.handleError(req, res, msg)
  }
}

module.exports = router
