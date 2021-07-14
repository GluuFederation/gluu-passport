const chai = require('chai')
const rewire = require('rewire')
const providers = rewire('../server/providers.js')
const config = require('config')
const PassportSAMLStrategy = require('passport-saml').Strategy
const helper = require('./helper')

const assert = chai.assert

describe('providers.js', () => {
  describe('setupStrategy', () => {
    before(() => {
      process.env.ALLOW_CONFIG_MUTATIONS = 'true'
      helper.configureLogger()
      const passportFullConfig = config.get('passportConfigAuthorizedResponse')
      const iiconfigStub = passportFullConfig.idpInitiated
      providers.__set__('iiconfig', iiconfigStub)
    })

    const passportStrategies = providers.__get__('passportStrategies')
    const setupStrategy = providers.__get__('setupStrategy')
    const testProvider = {
      ...config.passportConfigAuthorizedResponse.providers[0],
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

    it('added strategy should be a function', () => {
      setupStrategy(testProvider)
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
      const testProvider = config.passportConfigAuthorizedResponse.providers.find(
        provider => provider.id === 'saml-redis-test'
      )
      try {
        const oPassportSAMLStrategy = new PassportSAMLStrategy(
          testProvider.options, (profile, done) => { }
        )
        assert.exists(oPassportSAMLStrategy, 'Failed to initialize passport saml strategy')
      } catch (error) {
        assert.fail('Failed to intialize passport-saml strategy with redis setup')
      }
    })
  })
})
