var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin');

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.hostname, ":", global.serverPort, "/auth/linkedin/callback");
    passport.use(new LinkedInStrategy({
            consumerKey: credentials.consumerKey,
            consumerSecret: credentials.consumerSecret,
            callbackURL: callbackURL
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
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
}