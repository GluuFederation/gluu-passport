/* eslint-disable security/detect-non-literal-require */
/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const { Strategy } = require('openid-client')
const rewire = require('rewire')
const rewiredOpenIDClientHelper = rewire('../server/utils/openid-client-helper')
const InitMock = require('./testdata/init-mock')
const config = require('config')

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')

describe('Test OpenID Client Helper', () => {
  const testProvider = passportConfigAuthorizedResponse.providers.find(p => p.id === 'oidccedev6privatejwt')
  let kid = null
  const jwksFilePath = `../server/jwks/${testProvider.id}.json`

  describe('generateJWKS test', () => {
    const generateJWKS = rewiredOpenIDClientHelper.__get__('generateJWKS')

    it('generateJWKS should exist', () => {
      assert.exists(generateJWKS)
    })

    it('generateJWKS should be function', () => {
      assert.isFunction(generateJWKS, 'generateJWKS is not a function')
    })

    it('generateJWKS should generate jwks for provider in jwks folder', async () => {
      await generateJWKS(testProvider)
      assert.exists(jwksFilePath, `${jwksFilePath} file not found`)
    })

    it('make sure jwks has keys and kid', () => {
      const jwks = require(jwksFilePath)
      assert.isArray(jwks.keys, 'keys not found in jwks')
      kid = jwks.keys[0].kid
      assert.exists(kid, 'kid not found in jwks')
    })

    it('make sure generateJWKS not regenerating jwks again and rewrite existing jwks data', async () => {
      await generateJWKS(testProvider)
      const jwks = require(jwksFilePath)
      assert.equal(kid, jwks.keys[0].kid, `${kid} is not matching with ${jwks.keys[0].kid}`)
    })
  })

  describe('getClient test', () => {
    const getClient = rewiredOpenIDClientHelper.__get__('getClient')

    it('getClient should exist', () => {
      assert.exists(getClient)
    })

    it('getClient should be function', () => {
      assert.isFunction(getClient, 'getClient is not a function')
    })

    it('getClient should return the client object to initialize openid-client strategy', async () => {
      const initMock = new InitMock()
      initMock.discoveryURL(testProvider.options.issuer)

      const client = await getClient(testProvider)
      assert.exists(client, 'failed to make client for openid-client strategy')
      const strategy = new Strategy({ client }, () => {})
      assert.exists(strategy, 'Failed to create strategy')
    })

    it('we have now already client initialize so we should get client from state', async () => {
      const client = await getClient(testProvider)
      assert.exists(client, 'failed to make client for openid-client strategy')
      const strategy = new Strategy({ client }, () => {})
      assert.exists(strategy, 'Failed to create strategy')
    })
  })
})
