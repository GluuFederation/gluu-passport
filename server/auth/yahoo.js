var passport = require('passport');
var YahooStrategy = require('passport-yahoo').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = global.applicationHost.concat("/passport/auth/yahoo/callback");
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
            };
            return done(null, userProfile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
};
