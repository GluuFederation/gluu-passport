var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('twitter', function(err, data){
	passport.use(new TwitterStrategy({
		consumerKey: data.consumerKey,
    	consumerSecret: data.consumerSecret,
    	callbackURL: data.callbackURL,
	    profileFields: ['id', 'name', 'displayName', 'email']
  	},
  	function(accessToken, refreshToken, profile, done) {
			var userProfile = {
	      id: profile.id,
	      name: profile.displayName || profile.username,
	      username: profile.username || profile.id,
	      email: profile.email || "",
	      givenName: profile.first_name || "",
	      familyName: profile.last_name || "",
	      provider: profile.provider,
	      accessToken: accessToken
	    }
			console.log("UserProfile: ", userProfile);
	    return done(null, userProfile);
  	}
	));
});

module.exports = passport;
