/* eslint-disable security/detect-non-literal-fs-filename */
const rewire = require('rewire')
const umaRewire = rewire('../server/utils/uma')
const sinon = require('sinon')
const config = require('config')
const chai = require('chai')

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')

describe('uma.js test', () => {
  describe('test getTokenEndpoint', () => {
    const getTokenEndpoint = umaRewire.__get__('getTokenEndpoint')

    it('should be exist', () => {
      assert.exists(getTokenEndpoint)
    })

    it('should be request to uma config endpoint and get token endpoint', async () => {
      const gotGet = sinon.stub(require('got'), 'get')
      const umaConfigURL = passportConfigAuthorizedResponse.conf.serverURI + '/.well-known/uma2-configuration'
      const mockTokenEndpoint = passportConfigAuthorizedResponse.conf.serverURI + '/oxauth/restv1/token'
      gotGet.reset()
      gotGet.resolves({
        body: JSON.stringify({
          token_endpoint: mockTokenEndpoint
        })
      })
      const tokenEndpoint = await getTokenEndpoint(umaConfigURL)
      assert(gotGet.calledWith(umaConfigURL))
      assert.equal(tokenEndpoint, mockTokenEndpoint)
      gotGet.restore()
    })

    it('should be return error when got throw error', async () => {
      const gotGet = sinon.stub(require('got'), 'get')
      const umaConfigURL = passportConfigAuthorizedResponse.conf.serverURI + '/.well-known/uma2-configuration'
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
      const gotGet = sinon.stub(require('got'), 'get')
      const umaConfigURL = passportConfigAuthorizedResponse.conf.serverURI + '/.well-known/uma2-configuration'
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
})
