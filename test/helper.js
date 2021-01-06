// Use this file to avoid repeating yourself (DRY!), helper functions.

const InitMock = require('./testdata/init-mock')
const logger = require('../server/utils/logging')
const config = require('config')
const basicConfig = config.get('passportConfig')

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
const setupServer = function () {
  return new Promise((resolve, reject) => {
    const InitMock = require('../test/testdata/init-mock')
    const server = require('../server/app')

    const initMock = new InitMock()
    initMock.passportConfigEndpoint()
    initMock.umaTokenEndpoint()
    initMock.umaConfigurationEndpoint()

    // waits for the server to start (app.listen)
    server.on('appStarted', () => {
      console.log('app started...')
      return resolve()
    })
  })
}

module.exports = {
  mockedAppInit,
  configureLogger,
  setupServer
}
