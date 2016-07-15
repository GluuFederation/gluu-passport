var passport = require('passport');
var WindowsLiveStrategy = require('passport-windowslive').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new WindowsLiveStrategy({

    clientID: config.windowslive.clientID,
  clientSecret: config.windowslive.clientSecret,
  callbackURL: config.windowslive.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
