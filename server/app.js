const config = require('config')
const logger = require('./utils/logging')
const misc = require('./utils/misc')
const confDiscovery = require('./utils/configDiscovery')
const providers = require('./providers')
const passportFile = config.get('passportFile')
const AppFactory = require('./app-factory')

let httpServer
let httpPort = -1
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const appFactoryInstance = new AppFactory()
const app = appFactoryInstance.createApp()

/**
 * Creates express server for the first time and recreates if port changed
 * @param serverURI - server host and uri
 * @param port - port to create server
 */
function recreateHttpServer (serverURI, port) {
  logger.log2('debug',
    `entered recreateHttpServer(serverURI=${serverURI},port=${port}`)
  logger.log2('debug', `httpPort = ${httpPort}`)

  // Closes and creates a new server if port has changed
  // after configuration file fetched, it will also change to 8090
  if (httpPort !== port) {
    httpPort = port

    if (httpServer) {
      httpServer.close(() => logger.log2(
        'info', 'Server stopped accepting connections')
      )
    }
    httpServer = app.listen(port, () => {
      logger.log2('info', `Server listening on ${serverURI}:${port}`)
      console.log(`Server listening on ${serverURI}:${port}`)
      app.emit('appStarted') // event emitter for tests
    })
    module.exports = httpServer
  }
}

function reconfigure (cfg) {
  global.config = cfg.conf
  global.iiconfig = cfg.idpInitiated

  // Apply all runtime configuration changes
  logger.configure(cfg.conf.logging)
  providers.setup(cfg.providers)
  recreateHttpServer(cfg.conf.serverURI, cfg.conf.serverWebPort)
}

function pollConfiguration (configEndpoint) {
  misc.pipePromise(confDiscovery.retrieve, reconfigure)(configEndpoint)
    .catch(e => {
      logger.log2('error', e.toString())
      logger.log2('debug', e.stack)
      logger.log2(
        'warn', 'An attempt to get configuration data ' +
        'will be tried again soon')
    })
  setTimeout(
    pollConfiguration, config.get('timerInterval'), configEndpoint
  )
  // 1 minute timer
}

function init () {
  // Read the minimal params to start
  const basicConfig = require(passportFile)
  // Start logging with basic params
  logger.configure(
    {
      level: basicConfig.logLevel,
      consoleLogOnly: basicConfig.consoleLogOnly
    })

  const props = [
    'clientId',
    'keyPath',
    'keyId',
    'keyAlg',
    'configurationEndpoint',
    'failureRedirectUrl'
  ]
  if (misc.hasData(props, basicConfig)) {
    global.basicConfig = basicConfig
    // Try to gather the configuration
    pollConfiguration(basicConfig.configurationEndpoint)
  } else {
    logger.log2('error', 'passport-config file is missing data')
  }
}

module.exports = app

init()
