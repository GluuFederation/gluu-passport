var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.twitter.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
