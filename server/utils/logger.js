var fs = require('fs'),
    Stomp = require('stomp-client'),
    winston = require('winston'),
    dir = process.env.NODE_LOGGING_DIR || __dirname + '/logs';
require('winston-daily-rotate-file');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

winston.emitErrs = true;

var logOpts = {
    level: 'info',
    filename: dir + '/passport.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, //5MB
    colorize: false,
    datePattern: '.yyyy-MM-dd'
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

var sendMQMessage = function sendMessage(messageToPublish) {
    if(mqSetUp){
        var stompClient = new Stomp(MQDetails);
        stompClient.connect(function (sessionId) {
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
