var passport = require('passport');
var DropboxStrategy = require('passport-dropbox').Strategy;

var config = require('../_config');
var init = require('./init');

passport.use(new DropboxStrategy({
    consumerKey: config.dropbox.consumerKey,
    consumerSecret: config.dropbox.consumerSecret,
    callbackURL: config.dropbox.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
