var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin');

var config = require('../_config');
var init = require('./init');

passport.use(new LinkedInStrategy({
    consumerKey: config.linkedin.clientID,
    consumerSecret: config.linkedin.clientSecret,
    callbackURL: config.linkedin.callbackURL
  },
  function(token, tokenSecret, profile, done) {
    return done(null, profile);
  }

));

// serialize user into the session
init();


module.exports = passport;
