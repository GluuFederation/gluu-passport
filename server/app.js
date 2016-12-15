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
var getConsumerDetails = require('./auth/getConsumerDetails');
var logger = require("./utils/logger");

global.applicationHost = "https://" + global.config.serverURI;
global.applicationSecretKey = uuid();

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
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Expose-Headers", "Authorization");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Request-Methods", "POST, GET, PUT, DELETE, OPTIONS");

    next();
});

// *** config middleware *** //
app.use(require('morgan')('combined', { "stream": logger.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());
app.use(session({
    secret: uuid(),
    key: uuid()
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get('/passport/token', function(req, res) {
    var token = jwt.sign({
        "jwt": uuid()
    }, global.applicationSecretKey, {
        expiresIn: 1440
    });
    return res.send(200, {
        "token_": token
    });
});

// *** main routes *** //
app.use('/passport', require('./routes/index.js'));

// *** error handlers *** //
app.use(function (err, req, res, next) {
    logger.log('error', 'Unknown Error: ' + JSON.stringify(err));
    res.redirect('/passport/login');
});

process.on('uncaughtException', function(err) {
    logger.log('error', 'Uncaught Exception: ' + JSON.stringify(err));
});

if (('development' == app.get('env')) || true) { // To make sure that the requests are not rejected
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

var listener = server.createServer(app).listen(global.config.serverWebPort, getConsumerDetails.getTokenEndpoint(function(err, data) {
    if(err){
        logger.log('error', "Error in starting the server. error:- ", err);
    } else {
        logger.info("Server listning on http://localhost:" + global.config.serverWebPort);
    }
}));
