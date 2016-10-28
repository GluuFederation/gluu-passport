var passport = require('passport');
var YahooStrategy = require('passport-yahoo').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.serverAddress, ":", global.serverPort, "/auth/yahoo/callback");
    passport.use(new YahooStrategy({
            consumerKey: credentials.clientID,
            consumerSecret: credentials.clientSecret,
            returnURL: callbackURL
        },
        function(id, profile, profileMethods, done) {
            var displayname = profile.displayName.split(" ");
            var userProfile = {
                id: id,
                name: profile.displayName,
                username: profile.username || id,
                email: profile.emails[0].value,
                givenName: displayname[0] || profile.name.givenName || "",
                familyName: displayname[1] || profile.name.familyName || "",
                provider: profile.provider || "yahoo",
                accessToken: profile.accessToken || ""
            }
            return done(null, userProfile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
}

// var passport = require('passport');
// var YahooStrategy = require('passport-yahoo-oauth2').OAuth2Strategy;
// //var YahooStrategy = require('passport-yahoo-oauth').Strategy;
// //var YahooStrategy = require('passport-yahoo-token');
// var consumerDetailsRequester = require('./consumerDetailsRequester');
// var config = require('../_config');
//
// consumerDetailsRequester.credentialsRequester('yahoo', function(err, data){
// 	passport.use(new YahooStrategy({
// 	    clientID: data.consumerKey,
// 	    clientSecret: data.consumerSecret,
// 	    redirectUri: data.callbackURL,
// 			passReqToCallback: true
// 	  },
// 		function(accessToken, tokenSecret, profile, done) {
// 	  	var userProfile = {
// 	    	id: profile.id,
// 	    	name: profile.displayName,
// 	    	username: profile.username || id,
// 				email: profile.emails[0].value,
// 	    	givenName: profile.name.givenName || "",
// 	    	familyName: profile.name.familyName || "",
// 	    	provider: profile.provider || "yahoo",
// 	      accessToken: accessToken || ""
// 			}
// 			return done(null, profile);
// 		}
// 	));
// });
// module.exports = passport;
