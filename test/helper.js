// Use this file to avoid repeating yourself (DRY!), helper functions.

import InitMock from './testdata/init-mock.js'
import * as logger from '../server/utils/logging.js'
import config from 'config'
import chai from 'chai'
import chaiHttp from 'chai-http'

const basicConfig = config.get('passportConfig')
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
const setupServer = function () {
  return import('../server/app.js')
    .then(async (module) => {
      const server = module.default
      await server.on('appStarted', function () {
        console.log('app started event listened...')
      })
      await server.rateLimiter.resetKey('::ffff:127.0.0.1')
      return chai.request(server).keepOpen()
    })
}

export {
  mockedAppInit,
  configureLogger,
  setupServer
}
