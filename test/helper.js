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

module.exports = {
  mockedAppInit,
  configureLogger
}
