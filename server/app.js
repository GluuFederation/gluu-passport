import config from 'config'
import fs from 'fs'
import * as logger from './utils/logging.js'
import * as misc from './utils/misc.js'
import * as confDiscovery from './utils/configDiscovery.js'
import * as providers from './providers.js'
import { AppFactory } from './app-factory.js'

const passportFile = config.get('passportFile')
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

async function init () {
  // Read the minimal params to start
  const basicConfig = JSON.parse(
    fs.readFileSync(
      new URL(passportFile, import.meta.url)
    )
  )

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

export default app

init()
