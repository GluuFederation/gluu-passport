var passport = require('passport');
var DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = global.applicationHost.concat("/passport/auth/dropbox/callback");
    passport.use(new DropboxOAuth2Strategy({
            apiVersion: '2',
            clientID: credentials.clientID,
            clientSecret: credentials.clientSecret,
            callbackURL: callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            var userProfile = {
                id: profile.id || "",
                name: profile.displayName || profile.username || "",
                username: profile.username || profile.id || "",
                email: profile.emails[0].value || "",
                givenName: profile.first_name || "",
                familyName: profile.last_name || "",
                provider: "dropbox"
            }
            return done(null, userProfile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
};
