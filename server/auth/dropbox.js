var passport = require('passport');
var DropboxStrategy = require('passport-dropbox').Strategy;
var consumerDetailsRequester = require('./consumerDetailsRequester');
var config = require('../_config');

consumerDetailsRequester.credentialsRequester('dropbox', function(err, data){
	passport.use(new DropboxStrategy({
	    consumerKey: data.consumerKey,
	    consumerSecret: data.consumerSecret,
	    callbackURL: data.callbackURL
	  },
	  function(accessToken, refreshToken, profile, done) {
	    return done(null, profile);
	  }
	));
});

module.exports = passport;
