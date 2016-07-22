var passport = require('passport');
var WindowsLiveStrategy = require('passport-windowslive').Strategy;
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('windowslive', function(err, data){
	passport.use(new WindowsLiveStrategy({
	  clientID: data.consumerKey,
	  clientSecret: data.consumerSecret,
	  callbackURL: data.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
	    return done(null, profile);
	  }
	));
});
module.exports = passport;
