var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('facebook', function(err, data){
	passport.use(new FacebookStrategy({
	    clientID: data.consumerKey,
	    clientSecret: data.consumerSecret,
	    callbackURL: data.callbackURL,
	    enableProof: true,
	    profileFields: ['id', 'name', 'displayName', 'email']
	  },
	  function(accessToken, refreshToken, profile, done) {
			var userProfile = {
	      id: profile._json.id,
	      name: profile.displayName,
	      username: profile.username || profile._json.id,
	      email: profile._json.email,
	      givenName: profile._json.first_name,
	      familyName: profile._json.last_name,
	      provider: profile.provider,
	      accessToken: accessToken
	    }
	    return done(null, userProfile);
	  }
	));
});
module.exports = passport;
