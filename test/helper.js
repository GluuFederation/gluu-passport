const logger = require('../server/utils/logging')

function configureLogger() {
	
	logger.configure({
		level: 'debug',

	})
}

function init(){ 
	configureLogger()
	logger.log2('debug','test helper init called')
}

init()