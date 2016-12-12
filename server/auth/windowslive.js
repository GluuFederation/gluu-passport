var passport = require('passport');
var WindowsLiveStrategy = require('passport-windowslive').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = global.applicationHost.concat("/passport/auth/windowslive/callback");
    passport.use(new WindowsLiveStrategy({
            clientID: credentials.clientID,
            clientSecret: credentials.clientSecret,
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
};
