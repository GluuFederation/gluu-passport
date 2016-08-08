var passport = require('passport');
var DropboxStrategy = require('passport-dropbox').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.hostname, ":", global.serverPort, "/auth/dropbox/callback");
    passport.use(new DropboxStrategy({
            consumerKey: credentials.consumerKey,
            consumerSecret: credentials.consumerSecret,
            callbackURL: callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    ));
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
}