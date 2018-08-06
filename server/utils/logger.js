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
    tailable: true,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
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

var transport = new winston.transports.DailyRotateFile(logOpts);

var logger = new (winston.Logger)({
    transports: [
        transport
    ],
    exitOnError: false
});

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

var sendMQMessage = function sendMessage() {
    if(mqSetUp){
        var stompClient = new Stomp(MQDetails);
        stompClient.connect(function (sessionId) {
			messageToPublish = util.format.apply(util, Array.prototype.slice.apply(arguments))
            this.publish('/' + MQDetails.CLIENT_QUEUE_NAME, messageToPublish);
        });
    }
};

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message.slice(0, -1));
    }
};
module.exports.sendMQMessage = sendMQMessage;
