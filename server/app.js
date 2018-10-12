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
var uuid = require('uuid');

global.config = require('/etc/gluu/conf/passport-config.json')
global.saml_config = require('/etc/gluu/conf/passport-saml-config.json')
global.saml_idp_init_config = require('/etc/gluu/conf/passport-inbound-idp-initiated.json')

var getConsumerDetails = require('./auth/getConsumerDetails');
var logger = require("./utils/logger");
//Ensure misc initializes before any usage
require('./utils/misc')()

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
	 setTimeout(pollConfiguration, 60000)	 //1 minute timer
}
