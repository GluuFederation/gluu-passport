var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin');
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('linkedin', function(err, data){
	passport.use(new LinkedInStrategy({
	    consumerKey: data.consumerKey,
	    consumerSecret: data.consumerSecret,
	    callbackURL: data.callbackURL
	  },
	  function(token, tokenSecret, profile, done) {
			var userProfile = {
	      id: profile.id,
	      name: profile.displayName,
	      username: profile.username || profile.id,
	      email: profile.email,
	      givenName: profile.name.givenName,
	      familyName: profile.name.familyName,
	      provider: profile.provider,
	      accessToken: token
	    }
	    return done(null, userProfile);
	  }

	));
});

module.exports = passport;
