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

module.exports = {
  mockedAppInit
}
