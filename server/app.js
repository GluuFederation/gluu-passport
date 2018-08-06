// *** main dependencies *** //
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var passport = require('passport');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var uuid = require('uuid');

global.config = require('/etc/gluu/conf/passport-config.json');
global.saml_config = require('/etc/gluu/conf/passport-saml-config.json');
var getConsumerDetails = require('./auth/getConsumerDetails');
var logger = require("./utils/logger");

global.applicationHost = "https://" + global.config.serverURI;
global.applicationSecretKey = uuid();

if (!process.env.NODE_LOGGING_DIR) {
    logger.log2('error', 'NODE_LOGGING_DIR was not set, Default log folder will be used')
}

// *** express instance *** //
var app = express();

var server = require('http');

// *** view engine *** //
var swig = new swig.Swig();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

// *** static directory *** //
app.set('views', path.join(__dirname, 'views'));

//Allow cross origin
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Expose-Headers", "Authorization");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Request-Methods", "POST, GET, PUT, DELETE, OPTIONS");

    next();
});

// *** config middleware *** //
app.use(require('morgan')('combined', {"stream": logger.stream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());
app.use(session({
    secret: uuid(),
    key: uuid(),
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.get('/passport/token', function (req, res) {
	logger.log2('verbose', 'Issuing token')
    var token = jwt.sign({
        "jwt": uuid()
    }, global.applicationSecretKey, {
        expiresIn: 120
    });
    return res.send(200, {
        "token_": token
    });
});

// *** main routes *** //
app.use('/passport', require('./routes/index.js'));

// *** error handlers *** //
app.use(function (err, req, res, next) {
    if (err) {
        logger.log2('error', 'Unknown Error: %s', JSON.stringify(err))
        res.redirect('/passport/login')
    }
});

process.on('uncaughtException', function (err) {
    logger.log2('error', 'Uncaught Exception: %s', JSON.stringify(err))
});

if (('development' == app.get('env')) || true) { // To make sure that requests are not rejected
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

server.createServer(app).listen(global.config.serverWebPort, () => {
		logger.log2('info', 'Server listening on %s:%s', global.config.serverURI, global.config.serverWebPort)
		pollConfiguration()
	}
)

function pollConfiguration() {
	 getConsumerDetails.reloadConfiguration(true)
	 setTimeout(pollConfiguration, 30000)	 //30 seconds timer
}

//MIIDbDCCAlQCCQCuwqx2PNP/eTANBgkqhkiG9w0BAQsFADB4MQswCQYDVQQGEwJVUzELMAkGA1UECAwCVFgxDzANBgNVBAcMBkF1c3RpbjESMBAGA1UECgwJR2x1dSBJbmMuMRkwFwYDVQQDDBBhcnZpbmQyLmdsdXUub3JnMRwwGgYJKoZIhvcNAQkBFg1pbmZvQGdsdXUub3JnMB4XDTE3MTEwNjA3MjQwMloXDTE4MTEwNjA3MjQwMloweDELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAlRYMQ8wDQYDVQQHDAZBdXN0aW4xEjAQBgNVBAoMCUdsdXUgSW5jLjEZMBcGA1UEAwwQYXJ2aW5kMi5nbHV1Lm9yZzEcMBoGCSqGSIb3DQEJARYNaW5mb0BnbHV1Lm9yZzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKLPEepcCvxE9PXEm5z65hBLagCiDsaay8ImEwWMxnGdgRPxk+WFYXk15eHOKkmW0B+/6u/bV4BHg4NEDSbm1UmKbg+g7icaJQJimtibMfpY/qJQmqCBwN3Wtj0buUkkrLdjcgPab24I5FMEcRDxoXEnvvdNZR1ZxM5eXt6dTMPuLEGCXqRTHjdBCbF3JigfKk6K6/yxWzU0ztJG/susN3uOW+aLrZAbIGYbVhhqcQ7g1ec7eJXwmotdRK9zycHi7ULdFoj/PnzxdU6qwFYzG4/QgZ5z+mtQyOxcYlCkeGDPRh6D6SkwsDmuWbmtvF5JVgsc9Ow2BkkLvrpfE3H9vSkCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAZGPZPCRBkPdSw8G9NKza4L2ji/q0GnCJsyAKHu7O1jl9PGR48T+13MZ0fsZgE1jhrV+YOaxIiz0lUe2oKYykBRBFRDxU0WV4XczOjhpSbXy04F4NIQS4tVpjmGlWxaaMC2xxm8bVWOT7rVGiuo3TA+OFlaSyKAf4AmFWRjVpFhh9BjaQ7nFf0HT16u+NW3Myyuag8x3Hi19u9E9nMRUQqB8W3UXxuZC7Oi1M7pzu0ycGPqjM1fz97W2ldYmvby51HV/g8F7kbewjzBRT2XsLA0+ATMBugORAEzJ6WUrr0WxphU1f7qoLc7djNztG/8Q5WhSU8L6W/smzmHDP2/YsMw==
