const chai = require('chai')
const rewire = require('rewire')
const providers = rewire('../server/providers.js')
const testConfig = require('../config/test')
const PassportSAMLStrategy = require('passport-saml').Strategy

const assert = chai.assert

describe('providers setupStrategy', () => {
  const passportStrategies = providers.__get__('passportStrategies')
  const setupStrategy = providers.__get__('setupStrategy')
  const testProvider = {
    ...testConfig.passportConfigAuthorizedResponse.providers[0],
    verifyCallbackArity: 0
  }

  it('passport strategies array should be empty first time', () => {
    assert.deepEqual(passportStrategies, [])
  })

  it('new strategy should be added in passport strategies', () => {
    setupStrategy(testProvider)

    assert.lengthOf(passportStrategies, 1)
    assert.isFunction(
      passportStrategies[0].Strategy,
      'Strategy is not a function!'
    )
  })

  it('existing loaded strategy should be found and load again', () => {
    setupStrategy(testProvider)

    assert.lengthOf(passportStrategies, 1)
    assert.isFunction(
      passportStrategies[0].Strategy,
      'Strategy is not a function!'
    )
  })

  it('Passport SAML Provider with redis setup should initialize the passport-saml strategy', () => {
    const testProvider = testConfig.passportConfigAuthorizedResponse.providers.find(provider => provider.id === 'saml-redis-test')

    const oPassportSAMLStrategy = new PassportSAMLStrategy(testProvider.options, (profile, done) => { })
    assert.exists(oPassportSAMLStrategy, 'Failed to initialize passport saml strategy')
  })
})
