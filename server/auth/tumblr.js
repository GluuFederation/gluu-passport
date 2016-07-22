var passport = require('passport');
var TumblrStrategy = require('passport-tumblr').Strategy;
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('tumblr', function(err, data){
	passport.use(new TumblrStrategy({
	    consumerKey: data.consumerKey,
	    consumerSecret: data.consumerSecret,
	    callbackURL: data.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
			var userProfile = {
	      id: profile.id || accessToken,
	      name: profile._json.response.user.name,
	      username: profile.username || profile.id,
	      email: profile.email || "",
	      givenName: profile.givenName || "",
	      familyName: profile.familyName || "",
	      provider: profile.provider || "tumblr",
	      accessToken: accessToken
	    }
	    return done(null, userProfile);
	  }

	));
});

module.exports = passport;
