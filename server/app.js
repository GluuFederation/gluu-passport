
const config = require('config')
const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const morgan = require('morgan')
const logger = require('./utils/logging')
const misc = require('./utils/misc')
const confDiscovery = require('./utils/configDiscovery')
const routes = require('./routes')
const providers = require('./providers')
const passportFile = config.get('passportFile')
const metricsMiddleware = require('../server/utils/metrics')

const app = express()

var httpServer, httpPort = -1
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

app.use(metricsMiddleware)
app.use(morgan('short', { stream: logger.logger.stream }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(session({
	cookie: {
		maxAge: 86400000
	},
	store: new MemoryStore({
		checkPeriod: 86400000 // prune expired entries every 24h
	}),
	secret: 'wtf',
	resave: false,
	saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use('/passport', routes)

// Default error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, {redirect}, next) => {
// app.use((err, req, res, next) => {
	logger.log2('error', `Unknown Error: ${err}`)
	logger.log2('error', err.stack)
	redirect(
		`${global.basicConfig.failureRedirectUrl}?failure=An error occurred`
	)
})

passport.serializeUser((user, done) => {
	done(null, user)
})

passport.deserializeUser((user, done) => {
	done(null, user)
})


/**
 * Creates express server for the first time and recreates if port changed
 * @param serverURI - server host and uri
 * @param port - port to create server
 */
function recreateHttpServer(serverURI, port) {
	logger.log2('debug',
		`entered recreateHttpServer(serverURI=${serverURI},port=${port}`)
	logger.log2('debug', `httpPort = ${httpPort}`)

	//Closes and creates a new server if port has changed
	//after configuration file fetched, it will also change to 8090
	if (httpPort != port) {
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

			// module.exports = server
		})

	}

}

function reconfigure(cfg) {

	global.config = cfg.conf
	global.iiconfig = cfg.idpInitiated

	//Apply all runtime configuration changes
	logger.configure(cfg.conf.logging)
	providers.setup(cfg.providers)
	recreateHttpServer(cfg.conf.serverURI, cfg.conf.serverWebPort)

}

function pollConfiguration(configEndpoint) {
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
	//1 minute timer
}

function init() {

	//Read the minimal params to start
	let basicConfig = require(passportFile)
	//Start logging with basic params
	logger.configure(
		{
			level: 'DEBUG', //basicConfig.logLevel,
			consoleLogOnly: basicConfig.consoleLogOnly
		})

	let props = [
		'clientId',
		'keyPath',
		'keyId',
		'keyAlg',
		'configurationEndpoint',
		'failureRedirectUrl'
	]
	if (misc.hasData(props, basicConfig)) {
		global.basicConfig = basicConfig
		//Try to gather the configuration
		pollConfiguration(basicConfig.configurationEndpoint)
	} else {
		logger.log2('error', 'passport-config file is missing data')
	}

}


module.exports = app
init()