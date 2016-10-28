var passport = require('passport');
var GoogleStrategy = require('kroknet-passport-google-oauth').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.serverAddress, ":", global.serverPort, "/auth/google/callback");
    passport.use(new GoogleStrategy({
            clientID: credentials.clientID,
            clientSecret: credentials.clientSecret,
            callbackURL: callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
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
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
}