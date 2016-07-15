var passport = require('passport');
var TumblrStrategy = require('passport-tumblr').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new TumblrStrategy({
    consumerKey: config.tumblr.consumerKey,
    consumerSecret: config.tumblr.consumerSecret,
    callbackURL: config.tumblr.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
