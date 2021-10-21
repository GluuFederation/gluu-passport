const logger = require('../../server/utils/logging')
const { random, codeChallenge } = require('../../node_modules/openid-client/lib/helpers/generators');
const pick = require('../../node_modules/openid-client/lib/helpers/pick');
const OIDCStrategy = require('../../node_modules/openid-client/lib/passport_strategy');

async function setupSicOIDCStrategy (provider) {
  logger.log2('info', `Cutomizing strategy for provider ${provider.displayName}`)

  try {
    OIDCStrategy.prototype.authenticate = authenticate;
  } catch (error) {
      logger.log2('error', error.message)
  }
}

/* Authenticate function: with MFA customization (SIC) */
function authenticate(req, options) {
  (async () => {
    const client = this._client;
    if (!req.session) {
      throw new TypeError('authentication requires session support');
    }
    const reqParams = client.callbackParams(req);
    const sessionKey = this._key;

    /* start authentication request */
    if (Object.keys(reqParams).length === 0) {
      // provide options object with extra authentication parameters
      const params = {
        state: random(),
        ...this._params,
        ...options,
      };

      if (!params.nonce) {
        params.nonce = random();
      }

      req.session[sessionKey] = pick(params, 'nonce', 'state', 'max_age', 'response_type');

      if (this._usePKCE && params.response_type.includes('code')) {
        const verifier = random();
        req.session[sessionKey].code_verifier = verifier;

        switch (this._usePKCE) { // eslint-disable-line default-case
          case 'S256':
            params.code_challenge = codeChallenge(verifier);
            params.code_challenge_method = 'S256';
            break;
          case 'plain':
            params.code_challenge = verifier;
            break;
        }
      }

      /* start of SIC customizations */
      let allParams = {
        ...params,
        ...req.query
      };
 
      const provider = req.params.provider // provider
      if (provider.indexOf("mfa") == 0) { // Only when provider id starts with mfa
        // creation of the request object with all parameters
        requestObject = await client.requestObject(allParams);

        // Authorization params cleanings up 
        delete allParams.login_hint;

        authorizationUrlString = client.authorizationUrl(allParams);
        authorizationUrlString += "&request=" + requestObject;
        this.redirect(authorizationUrlString);
      }
      /* end of SIC customizations */
      
      this.redirect(client.authorizationUrl(params));
      return;
    }
    /* end authentication request */

    /* start authentication response */

    const session = req.session[sessionKey];
    if (Object.keys(session || {}).length === 0) {
      throw new Error(format('did not find expected authorization request details in session, req.session["%s"] is %j', sessionKey, session));
    }

    const {
      state, nonce, max_age: maxAge, code_verifier: codeVerifier, response_type: responseType,
    } = session;

    try {
      delete req.session[sessionKey];
    } catch (err) {}

    const opts = {
      redirect_uri: this._params.redirect_uri,
      ...options,
    };

    const checks = {
      state,
      nonce,
      max_age: maxAge,
      code_verifier: codeVerifier,
      response_type: responseType,
    };

    const tokenset = await client.callback(opts.redirect_uri, reqParams, checks, this._extras);

    const passReq = this._passReqToCallback;
    const loadUserinfo = this._verify.length > (passReq ? 3 : 2) && client.issuer.userinfo_endpoint;

    const args = [tokenset, verified.bind(this)];

    if (loadUserinfo) {
      if (!tokenset.access_token) {
        throw new RPError({
          message: 'expected access_token to be returned when asking for userinfo in verify callback',
          tokenset,
        });
      }
      const userinfo = await client.userinfo(tokenset);
      args.splice(1, 0, userinfo);
    }

    if (passReq) {
      args.unshift(req);
    }

    this._verify(...args);
    /* end authentication response */
  })().catch((error) => {
    if (
      (error instanceof OPError && error.error !== 'server_error' && !error.error.startsWith('invalid'))
      || error instanceof RPError
    ) {
      this.fail(error);
    } else {
      this.error(error);
    }
  });
};

module.exports = {
  setupSicOIDCStrategy:setupSicOIDCStrategy
}
