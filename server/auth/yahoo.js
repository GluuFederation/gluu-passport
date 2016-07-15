var passport = require('passport');
var YahooStrategy = require('passport-yahoo').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new YahooStrategy({
    consumerKey: config.yahoo.consumerKey,
    consumerSecret: config.yahoo.consumerSecret,
    returnURL: config.yahoo.returnURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
