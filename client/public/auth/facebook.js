var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new FacebookStrategy({
    consumerKey: config.facebook.consumerKey,
    consumerSecret: config.facebook.consumerSecret,
    callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
