// Use this file to avoid repeating yourself (DRY!), helper functions.

const InitMock = require('./testdata/init-mock')

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
  setupServer
}
