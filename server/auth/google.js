var passport = require('passport');
var GoogleStrategy = require('kroknet-passport-google-oauth').Strategy;
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('google', function(err, data){
  passport.use(new GoogleStrategy({
      clientID: data.consumerKey,
      clientSecret: data.consumerSecret,
      callbackURL: data.callbackURL
    // clientID: config.google.clientID,
    // clientSecret: config.google.clientSecret,
    // returnURL: config.google.returnURL,
    // redirect_uri: config.google.returnURL
    },
    function(accessToken, refreshToken, profile, done) {
      console.log(profile);
      var userProfile = {
	      id: profile.id,
	      name: profile.displayName,
	      username: profile.username || profile.id,
	      email: profile.emails[0].value,
	      givenName: profile.name.givenName,
	      familyName: profile.name.familyName,
	      provider: profile.provider,
	      accessToken: accessToken
	    }
	    return done(null, userProfile);
    }

  ));
});

module.exports = passport;
