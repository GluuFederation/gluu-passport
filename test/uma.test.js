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
const passportConfigurationEndpoint = passportConfig.configurationEndpoint

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

  describe('test doRequest', () => {
    const doRequest = umaRewire.__get__('doRequest')

    it('should exist', () => {
      assert.exists(doRequest)
    })

    it('should be request to config endpoint and get ticker', async () => {
      const gotGet = sinon.stub(got, 'get')
      gotGet.reset()
      const mockTicket = '016f84e8-f9b9-11e0-bd6f-0021cc6004de'
      gotGet.resolves({
        body: '',
        statusCode: 401,
        headers: {
          server: 'Apache/2.4.29 (Ubuntu)',
          'x-xss-protection': '1; mode=block',
          'x-content-type-options': 'nosniff',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'www-authenticate': `UMA realm="Authentication Required", host_id=chris.gluuthree.org, as_uri=https://chris.gluuthree.org/.well-known/uma2-configuration, ticket=${mockTicket}`,
          'content-length': '0',
          connection: 'close'
        }
      })
      const requestParams = {
        uri: passportConfigurationEndpoint,
        throwHttpErrors: false
      }
      const ticketRepsponse = await doRequest(requestParams)
      assert(gotGet.calledWith(requestParams.uri, {
        throwHttpErrors: false
      }))
      assert.equal(ticketRepsponse.ticket, mockTicket)
      gotGet.restore()
    })

    it('should return configurations', async () => {
      const rpt = {
        access_token: 'tEmPtEmPtEmPtEmPtEmPtEmP',
        pct: 'PmEtPmEtPmEtPmEtPmEtPmEt'
      }
      umaRewire.__set__('rpt', rpt)

      const gotGet = sinon.stub(got, 'get')
      gotGet.reset()
      gotGet.resolves({
        statusCode: 200,
        body: JSON.stringify(passportConfigAuthorizedResponse)
      })
      const doRequestParams = {
        uri: passportConfigurationEndpoint,
        throwHttpErrors: false
      }
      const configRepsponse = await doRequest(doRequestParams)
      assert(gotGet.calledWith(doRequestParams.uri, {
        throwHttpErrors: false,
        headers: {
          authorization: `Bearer ${rpt.access_token}`,
          pct: rpt.pct
        }
      }))
      assert.isNotNull(configRepsponse.conf)
      assert.isNotNull(configRepsponse.idpInitiated)
      assert.isNotNull(configRepsponse.providers)
      assert.isNotEmpty(configRepsponse.providers)
      gotGet.restore()
    })
  })

  describe('test processUnauthorized', () => {
    const processUnauthorized = umaRewire.__get__('processUnauthorized')

    it('should exist', () => {
      assert.exists(processUnauthorized)
    })

    it('should return configurations', async () => {
      const rpt = {
        access_token: 'tEmPtEmPtEmPtEmPtEmPtEmP',
        pct: 'PmEtPmEtPmEtPmEtPmEtPmEt'
      }
      umaRewire.__set__('rpt', rpt)

      // mock get token endpoint
      const gotGet = sinon.stub(got, 'get')
      gotGet.reset()
      gotGet.onCall(0).resolves({
        body: {
          token_endpoint: umaConfigTokenEndpoint
        }
      })

      // mock rpt request
      const gotGetRPTToken = sinon.stub(got, 'post')
      gotGetRPTToken.reset()
      gotGetRPTToken.resolves({
        body: {
          access_token: 'TeMpTeMpTeMpTeMpTeMp'
        }
      })

      // mock get config request
      const mockTicket = '016f84e8-f9b9-11e0-bd6f-0021cc6004de'
      gotGet.onCall(1).resolves({
        statusCode: 200,
        body: JSON.stringify(passportConfigAuthorizedResponse)
      })

      const processUnauthorizedResponse = await processUnauthorized(mockTicket, umaConfigURL, {
        uri: passportConfigurationEndpoint,
        throwHttpErrors: false
      })
      assert.isNotNull(processUnauthorizedResponse.conf)
      assert.isNotNull(processUnauthorizedResponse.idpInitiated)
      assert.isNotNull(processUnauthorizedResponse.providers)
      assert.isNotEmpty(processUnauthorizedResponse.providers)

      gotGet.restore()
      gotGetRPTToken.restore()
    })
  })
})
