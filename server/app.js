const
	config = require('config'),
	server = require('http'),
	app = require('express')(),
	session = require('express-session'),
	MemoryStore = require('memorystore')(session),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	passport = require('passport'),
	morgan = require('morgan'),
	logger = require('./utils/logging'),
	misc = require('./utils/misc'),
	confDiscovery = require('./utils/configDiscovery'),
	routes = require('./routes'),
	providers = require('./providers'),
	passportFile = process.env.passport_config_file || config.get('passportFile')


var httpServer, httpPort = -1
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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

//Default error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	logger.log2('error', `Unknown Error: ${err}`)
	logger.log2('error', err.stack)
	res.redirect(`${global.basicConfig.failureRedirectUrl}?failure=An error occurred`)
})

passport.serializeUser((user, done) => {
	done(null, user)
})

passport.deserializeUser((user, done) => {
	done(null, user)
})


function recreateHttpServer(serverURI, port) {

	//Closes and creates a new server if port has changed
	if (httpPort != port) {
		httpPort = port

		if (httpServer) {
			httpServer.close(() => logger.log2('info', 'Server stopped accepting connections'))
		}
		httpServer = server.createServer(app)
		httpServer.listen(port, () => {
			logger.log2('info', `Server listening on ${serverURI}:${port}`)
			console.log(`Server listening on ${serverURI}:${port}`)
			module.exports = httpServer;
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
			logger.log2('warn', 'An attempt to get configuration data will be tried again soon')
		})
	setTimeout(pollConfiguration, process.env.config_update_timer || 60000, configEndpoint)	 //1 minute timer
}

function init() {

	//Read the minimal params to start
	let basicConfig = require(passportFile)
	//Start logging with basic params
	logger.configure({ level: basicConfig.logLevel, consoleLogOnly: basicConfig.consoleLogOnly })

	let props = ['clientId', 'keyPath', 'keyId', 'keyAlg', 'configurationEndpoint', 'failureRedirectUrl']
	if (misc.hasData(props, basicConfig)) {
		global.basicConfig = basicConfig
		//Try to gather the configuration
		pollConfiguration(basicConfig.configurationEndpoint)
	} else {
		logger.log2('error', 'passport-config file is missing data')
	}

}

init()