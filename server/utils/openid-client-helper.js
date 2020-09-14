// This module aims to transform flat parameters supplied via oxTrust in the form required by openid-client to operate
const R = require('ramda')
const { Issuer } = require('openid-client')
const JWKS = 'jwks'
const AZP = 'additionalAuthorizedParties'

// See openid-client API Documentation
const issuerProperties = [
  'issuer',
  'authorization_endpoint',
  'token_endpoint',
  'jwks_uri',
  'userinfo_endpoint',
  'revocation_endpoint',
  'introspection_endpoint',
  'end_session_endpoint',
  'registration_endpoint',
  'token_endpoint_auth_methods_supported',
  'token_endpoint_auth_signing_alg_values_supported',
  'introspection_endpoint_auth_methods_supported',
  'introspection_endpoint_auth_signing_alg_values_supported',
  'revocation_endpoint_auth_methods_supported',
  'revocation_endpoint_auth_signing_alg_values_supported',
  'request_object_signing_alg_values_supported',
  'mtls_endpoint_aliases'
]

// See openid-client API Documentation
const clientProperties = [
  'client_id',
  'client_secret',
  'id_token_signed_response_alg',
  'id_token_encrypted_response_alg',
  'id_token_encrypted_response_enc',
  'userinfo_signed_response_alg',
  'userinfo_encrypted_response_alg',
  'userinfo_encrypted_response_enc',
  'redirect_uris',
  'response_types',
  'post_logout_redirect_uris',
  'default_max_age',
  'require_auth_time',
  'request_object_signing_alg',
  'request_object_encryption_alg',
  'request_object_encryption_enc',
  'token_endpoint_auth_method',
  'introspection_endpoint_auth_method',
  'revocation_endpoint_auth_method',
  'token_endpoint_auth_signing_alg',
  'introspection_endpoint_auth_signing_alg',
  'revocation_endpoint_auth_signing_alg',
  'tls_client_certificate_bound_access_tokens',
  JWKS,
  AZP
]

// These are the possible params of an OIDC authz request
const authzRequestParams = [
  'scope',
  'response_type',
  // client_id: Already part of client
  'redirect_uri',
  // state: makes no sense someone provides this in Passport
  'response_mode',
  // nonce: makes no sense someone provides this in Passport
  'display',
  'prompt',
  'max_age',
  'ui_locales',
  'id_token_hint',
  'login_hint',
  'acr_values'
]

// Assigns property p to dest if found in object src
function fillProp (dest, src, p) {
  if (R.has(p, src)) {
    dest[p] = src[p]
  }
}

const fillProp_ = R.curry(fillProp)

// Creates an object with the properties names passed when existing in object src
function populate (src, properties) {
  const dest = {}
  R.forEach(fillProp_(dest, src), properties)
  return dest
}

// Creates a client instance using relevant properties that may be found in options object
function getClient (options) {
  const issuerMeta = populate(options, issuerProperties)
  const metadata = populate(options, clientProperties)
  let jwks; let azp

  if (R.has(JWKS, metadata)) {
    jwks = metadata[JWKS]
    delete metadata[JWKS]
  }
  if (R.has(AZP, metadata)) {
    azp = R.objOf(AZP, metadata[AZP])
    delete metadata[AZP]
  }
  // console.log(JSON.stringify(issuerMeta))
  // console.log(JSON.stringify(metadata))
  const issuer = new Issuer(issuerMeta)
  return new issuer.Client(metadata, jwks, azp)
}

// Returns an object with properties found in options that are not listed in props array
function getResidualObject (options, props) {
  const keys = R.keys(options)
  const indexOf = (R.flip(R.indexOf))(props)
  const residual = {}

  // eslint-disable-next-line no-return-assign, no-void
  R.forEach(k => indexOf(k) === -1 ? residual[k] = options[k] : void (0), keys)
  // console.log(JSON.stringify(residual))
  return residual
}

// Builds an object suitable to be passed in the constructor of Strategy (see openid-client API Documentation)
function makeOptions (options) {
  const client = getClient(options)
  const params = populate(options, authzRequestParams)
  const allProps = R.concat(R.concat(issuerProperties, clientProperties), authzRequestParams)
  const opts = getResidualObject(options, allProps)

  opts.client = client
  opts.params = params
  return opts
}

module.exports = {
  makeOptions: makeOptions
}
