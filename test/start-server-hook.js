import InitMock from './testdata/init-mock.js'
import config from 'config'
const initMock = new InitMock()

const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')
const oidcProvider = passportConfigAuthorizedResponse.providers.find(p => p.id === 'oidccedev6')

/**
 * Wait for server to start (event appStarted) to start tests
 */
before((done) => {
  initMock.discoveryURL(oidcProvider.options.issuer)

  import('../server/app.js')
    .then((module) => {
      const server = module.default
      server.on('appStarted', function () {
        // remember you need --timeout on mocha CLI to be around 20000
        console.log('app started event listened...')
        done()
      })
    })
    .catch((e) => console.log(e))
})
