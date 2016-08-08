var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.hostname, ":", global.serverPort, "/auth/twitter/callback");
    passport.use(new TwitterStrategy({
            consumerKey: credentials.consumerKey,
            consumerSecret: credentials.consumerSecret,
            callbackURL: callbackURL,
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
            return done(null, userProfile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
}