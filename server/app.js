// *** main dependencies *** //
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var passport = require('passport');
var session = require('express-session');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var configureStrategies = require('./auth/configureStrategies');
var config = require('./_config');

//var RedisStore = require('connect-redis')(express.session);
//var REDIS_URL = process.env.REDISCLOUD_URL || "redis://localhost";
// *** routes *** //
var routes = require('./routes/index.js');

var sess;

// *** express instance *** //
var app = express();

var server = require('https');


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
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client/public')));
app.use(session({
    secret: 'keyboard cat',
    key: 'sid',
    cookie: {
        secure: false
    }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get('/token', function(req, res) {
    var token = jwt.sign({
        "name": "Gluuserver"
    }, config.applicationSecretKey, {
        expiresIn: 1440
    });
    res.send(200, {
        "token_": token
    });
    return;
});

// *** main routes *** //
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// *** error handlers *** //

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.redirect('/login');
    })
};

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.redirect('/login');
});


var options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
};

process.on('uncaughtException', function(err) {
    console.error(err);
});

var listner = server.createServer(options, app).listen(config.serverWebPort, config.serverURI, configureStrategies.setConfiguratins(),function() {
    global.serverAddress = listner.address().address;
    global.serverPort = listner.address().port;
    console.log("Server listning on https://" + listner.address().address + ":" + listner.address().port);
});
