var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth1').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new GoogleStrategy({
    consumerKey: config.google.consumerKey,
    consumerSecret: config.google.consumerSecret,
    callbackURL: config.google.returnURL
  // clientID: config.google.clientID,
  // clientSecret: config.google.clientSecret,
  // returnURL: config.google.returnURL,
  // redirect_uri: config.google.returnURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
