/* eslint-disable security/detect-non-literal-fs-filename */
const rewire = require('rewire')
const umaRewire = rewire('../server/utils/uma')
const sinon = require('sinon')
const config = require('config')
const chai = require('chai')
const got = require('got')
const { v4: uuidv4 } = require('uuid')

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')
const umaConfigURL = passportConfigAuthorizedResponse.conf.serverURI + '/.well-known/uma2-configuration'
const umaConfigTokenEndpoint = passportConfigAuthorizedResponse.conf.serverURI + '/oxauth/restv1/token'
const passportConfig = config.get('passportConfig')

describe('uma.js test', () => {
  describe('test getTokenEndpoint', () => {
    const getTokenEndpoint = umaRewire.__get__('getTokenEndpoint')

    it('should be exist', () => {
      assert.exists(getTokenEndpoint)
    })

    it('should be request to uma config endpoint and get token endpoint', async () => {
      const gotGet = sinon.stub(got, 'get')

      gotGet.reset()
      gotGet.resolves({
        body: {
          token_endpoint: umaConfigTokenEndpoint
        }
      })
      const tokenEndpoint = await getTokenEndpoint(umaConfigURL)
      assert(gotGet.calledWith(umaConfigURL, { responseType: 'json' }))
      assert.equal(tokenEndpoint, umaConfigTokenEndpoint)
      gotGet.restore()
    })

    it('should be return error when request fail', async () => {
      const gotGet = sinon.stub(got, 'get')
      gotGet.reset()
      const errorMessage = 'Failed to get token endpoint'
      gotGet.rejects(new Error(errorMessage))
      try {
        await getTokenEndpoint(umaConfigURL)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }
      gotGet.restore()
    })

    it('should be return error when token_endpoint is missing in response', async () => {
      const gotGet = sinon.stub(got, 'get')
      gotGet.reset()
      gotGet.resolves({
        body: JSON.stringify({ dummy: 'dummy' })
      })

      try {
        await getTokenEndpoint(umaConfigURL)
      } catch (e) {
        assert.equal(e.message.trim(), 'getTokenEndpoint. No token endpoint was found')
      }
      gotGet.restore()
    })
  })

  describe('test getRPT', () => {
    const getRPT = umaRewire.__get__('getRPT')
    const misc = require('../server/utils/misc')

    const clientId = passportConfig.clientId
    const now = new Date().getTime()

    const getRpJWTOptions = {
      iss: clientId,
      sub: clientId,
      aud: umaConfigTokenEndpoint,
      jti: uuidv4(),
      exp: now / 1000 + 30,
      iat: now
    }
    const clientAssertionToken = misc.getRpJWT(getRpJWTOptions)

    it('should be exist', () => {
      assert.exists(getRPT)
    })

    it('should get RPT token', async () => {
      const miscGetRpJWT = sinon.stub(misc, 'getRpJWT')
      miscGetRpJWT.reset()
      miscGetRpJWT.returns(clientAssertionToken)

      const gotPOST = sinon.stub(got, 'post')
      gotPOST.reset()
      gotPOST.resolves({
        body: {
          access_token: 'TeMpTeMpTeMpTeMpTeMp'
        }
      })

      const ticket = 'ticket'
      const rptToken = await getRPT(ticket, umaConfigTokenEndpoint)
      assert(miscGetRpJWT.calledOnce)
      assert(gotPOST.calledWith(umaConfigTokenEndpoint, {
        responseType: 'json',
        form: {
          grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
          client_assertion_type:
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: clientAssertionToken,
          client_id: clientId,
          ticket: ticket
        }
      }))
      assert.isNotNull(rptToken)
      miscGetRpJWT.restore()
      gotPOST.restore()
    })

    it('should return error when failed request fail', async () => {
      const miscGetRpJWT = sinon.stub(misc, 'getRpJWT')
      miscGetRpJWT.reset()
      miscGetRpJWT.returns(clientAssertionToken)

      const gotPOST = sinon.stub(got, 'post')
      gotPOST.reset()
      const errorMessage = 'Failed to get RPT Token'
      gotPOST.rejects(new Error(errorMessage))

      const ticket = 'ticket'
      try {
        await getRPT(ticket, umaConfigTokenEndpoint)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }

      miscGetRpJWT.restore()
      gotPOST.restore()
    })
  })
})
