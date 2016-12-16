var fs = require('fs'),
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

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message.slice(0, -1));
    }
};
