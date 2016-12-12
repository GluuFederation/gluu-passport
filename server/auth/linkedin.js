var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = global.applicationHost.concat("/passport/auth/linkedin/callback");
    passport.use(new LinkedInStrategy({
            clientID: credentials.clientID,
            clientSecret: credentials.clientSecret,
            callbackURL: callbackURL,
            scope: ['r_emailaddress', 'r_basicprofile'],
            state: true
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
            };
            return done(null, userProfile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
};
