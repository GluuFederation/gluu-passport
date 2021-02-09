/* eslint-disable security/detect-non-literal-fs-filename */
const rewire = require('rewire')
const configDiscoveryRewire = rewire('../server/utils/configDiscovery')
const chai = require('chai')
const config = require('config')
const sinon = require('sinon')
const uma = require('../server/utils/uma')

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')
const passportConfig = config.get('passportConfig')
const passportConfigurationEndpoint = passportConfig.configurationEndpoint

describe('test ConfigDiscovery', () => {
  describe('test validate', () => {
    const validate = configDiscoveryRewire.__get__('validate')

    it('should be exist', () => {
      assert.exists(validate)
    })

    it('should be function', () => {
      assert.isFunction(validate)
    })

    it('should return data if valid', () => {
      const response = validate(passportConfigAuthorizedResponse)
      assert.isNotNull(response.conf)
      assert.isNotNull(response.conf.logging)
      assert.isNotNull(response.conf.serverWebPort)
      assert.isNotNull(response.idpInitiated)
      assert.isNotNull(response.providers)
      assert.isNotEmpty(response.providers)
    })

    it('should return error if data is invalid', () => {
      try {
        validate({ dummy: 'dummy' })
      } catch (e) {
        assert.equal(e.message, 'Received data not in the expected format')
      }
    })
  })

  describe('test retrieve', () => {
    const retrieve = configDiscoveryRewire.__get__('retrieve')

    it('should be exist', () => {
      assert.exists(retrieve)
    })

    it('should be function', () => {
      assert.isFunction(retrieve)
    })

    it('should return configuration data', async () => {
      const stubUMARequest = sinon.stub(uma, 'request')
      stubUMARequest.reset()
      stubUMARequest.resolves(passportConfigAuthorizedResponse)

      const data = await retrieve(passportConfigurationEndpoint)
      assert.isNotNull(data.conf)
      assert.isNotNull(data.conf.logging)
      assert.isNotNull(data.conf.serverWebPort)
      assert.isNotNull(data.idpInitiated)
      assert.isNotNull(data.providers)
      assert.isNotEmpty(data.providers)
    })
  })
})
