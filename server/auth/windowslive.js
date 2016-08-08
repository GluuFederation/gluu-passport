var passport = require('passport');
var WindowsLiveStrategy = require('passport-windowslive').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.hostname, ":", global.serverPort, "/auth/windowslive/callback");
    passport.use(new WindowsLiveStrategy({
            clientID: credentials.consumerKey,
            clientSecret: credentials.consumerSecret,
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