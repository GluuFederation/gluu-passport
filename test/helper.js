// Use this file to avoid repeating yourself (DRY!), helper functions.

const InitMock = require('./testdata/init-mock')
const logger = require('../server/utils/logging')
const config = require('config')
const basicConfig = config.get('passportConfig')
const chai = require('chai')
const chaiHttp = require('chai-http')
const TwitterStrategy = require('passport-twitter').Strategy

chai.use(chaiHttp)

/**
 * Mocks external endpoints for app initalization
 */
const mockedAppInit = function () {
  const initMock = new InitMock()
  initMock.passportConfigEndpoint()
  initMock.umaConfigurationEndpoint()
  initMock.umaTokenEndpoint()
}

/**
 * Configures logger to be used in unit tests when needed
 */
const configureLogger = () => {
  logger.configure(
    {
      level: basicConfig.logLevel,
      consoleLogOnly: basicConfig.consoleLogOnly
    })
}

/**
 * Setup and start server for cucumber test
 */
const setupServer = async function () {
  const app = require('../server/app')
  await app.on('appStarted', () => {
    console.log('app started...')
  })
  await app.rateLimiter.resetKey('::ffff:127.0.0.1')
  return chai.request(app).keepOpen()
}

/**
 * initialize passport-twitter strategy
 * @returns passport-twitter strategy object
 */
function initTwitterStrategy () {
  const strategy = new TwitterStrategy({
    consumerKey: 'TWITTER_CONSUMER_KEY',
    consumerSecret: 'TWITTER_CONSUMER_SECRET',
    callbackURL: 'http://127.0.0.1:3000/auth/twitter/callback'
  },
  function (token, tokenSecret, profile, cb) {
  }
  )

  return strategy
}

module.exports = {
  mockedAppInit,
  configureLogger,
  setupServer,
  initTwitterStrategy
}
