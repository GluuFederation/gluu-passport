import chai from 'chai'
import config from 'config'
import esmock from 'esmock'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')
const passportConfig = config.get('passportConfig')
const passportConfigurationEndpoint = passportConfig.configurationEndpoint

const assertData = (data) => {
  assert.isNotNull(data.conf)
  assert.isNotNull(data.conf.logging)
  assert.isNotNull(data.conf.serverWebPort)
  assert.isNotNull(data.idpInitiated)
  assert.isNotNull(data.providers)
  assert.isNotEmpty(data.providers)
}

const mockConfigDiscovery = async () => {
  return esmock('../server/utils/configDiscovery', {
    '../server/utils/uma': {
      request: async () => {
        return passportConfigAuthorizedResponse
      }
    }
  })
}

describe('test ConfigDiscovery', () => {
  describe('test validate', () => {
    let configDiscovery, validate

    before(async () => {
      configDiscovery = await mockConfigDiscovery()
      validate = configDiscovery.validate
    })

    after(async () => {
      esmock.purge()
    })

    it('should be exist', () => {
      assert.exists(validate)
    })

    it('should be function', () => {
      assert.isFunction(validate)
    })

    it('should return data if valid', () => {
      const response = validate(passportConfigAuthorizedResponse)
      assertData(response)
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
    let retrieve, configDiscovery

    before(async () => {
      configDiscovery = await mockConfigDiscovery()
      retrieve = configDiscovery.retrieve
    })

    after(async () => {
      esmock.purge()
    })

    it('should be exist', () => {
      assert.exists(retrieve)
    })

    it('should be function', () => {
      assert.isFunction(retrieve)
    })

    it('should return configuration data', async () => {
      const data = await retrieve(passportConfigurationEndpoint)
      assertData(data)
    })
  })
})
