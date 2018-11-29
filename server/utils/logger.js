var	util = require('util'),
	fs = require('fs'),
    Stomp = require('stomp-client'),
    winston = require('winston'),
    dir = process.env.NODE_LOGGING_DIR || __dirname + '/logs';

require('winston-daily-rotate-file');
var dateFormat = require('dateformat');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

winston.emitErrs = true;

var logOpts = {
    level: global.config.logLevel ? global.config.logLevel : 'info',
    filename: dir + '/passport-%DATE%.log',
    handleExceptions: true,
    json: false,
    colorize: false,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    timestamp: function() {
        return dateFormat(new Date(), 'isoDateTime');
    },
    formatter: function(options) {
        return options.timestamp() + ' [' + options.level.toUpperCase() + '] ' +
            (options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
    }
};

var flogOpts = {
    level: logOpts.level,
    filename: dir + '/passport.log',
    json: logOpts.json,
    maxSize: logOpts.maxSize,
    maxFiles: 5,
    timestamp: logOpts.timestamp,
    formatter: logOpts.formatter,
    options: { flags : "w" }
}

var stdoutOpts = {
    level: logOpts.level,
    json: logOpts.json
}

var transport = new winston.transports.DailyRotateFile(logOpts)
var fileTransport = new winston.transports.File(flogOpts)
var consoleTransport = new winston.transports.Console(stdoutOpts)

var logger = new (winston.Logger)({
    transports: [ ],
    exitOnError: false
});


if (global.config.consoleLogOnly) {
	logger.add(consoleTransport, {}, true)
} else {
	logger.add(transport, {}, true)
	logger.add(fileTransport, {}, true)

	transport.on('rotate', function(oldFilename, newFilename) {
		//Flushes plain passport.log file
		logger.remove(fileTransport)
		fileTransport = new winston.transports.File(flogOpts)
		logger.add(fileTransport, {}, true)
	})
}

var mqSetUp = global.config.activeMQConf
                && global.config.activeMQConf.isEnabled
                && global.config.activeMQConf;

var MQDetails = {
    CLIENT_QUEUE_NAME: 'oauth2.audit.logging',
    host: mqSetUp.host ,
    port: mqSetUp.port,
    user: mqSetUp.username,
    password: mqSetUp.password,
    protocolVersion: '1.1',
    reconnectOpts: {
        retries: 10,
        delay: 5000
    }
};

var sendMQMessage = function () {
    if(mqSetUp){
        var stompClient = new Stomp(MQDetails)
        stompClient.connect(function (sessionId) {
			messageToPublish = util.format.apply(util, Array.prototype.slice.apply(arguments))
            this.publish('/' + MQDetails.CLIENT_QUEUE_NAME, messageToPublish)
        })
    }
}

var log2 = function (level, msg) {

	level = level ? level.toLowerCase() : 'info'
	level = (level == 'error' || level == 'warn' || level == 'info' || level == 'verbose' || level == 'debug' || level == 'silly') ? level : 'info'
	msg = msg || ''

	arguments['0'] = level
	arguments['1'] = msg

	//Log it to winston logger
	args = Array.prototype.slice.apply(arguments)
	logger.log.apply(logger, args)

	//Log it to MQ
	args[1] = level + ": " + args[1]
	args.shift()
	sendMQMessage.apply(this, args)

}


module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message.slice(0, -1));
    }
};
module.exports.sendMQMessage = sendMQMessage
module.exports.log2 = log2
