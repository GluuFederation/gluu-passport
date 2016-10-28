var passport = require('passport');
var TumblrStrategy = require('passport-tumblr').Strategy;

var setCredentials = function(credentials) {
    var callbackURL = "https://".concat(global.serverAddress, ":", global.serverPort, "/auth/tumblr/callback");
    passport.use(new TumblrStrategy({
            consumerKey: credentials.clientID,
            consumerSecret: credentials.clientSecret,
            callbackURL: callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            var userProfile = {
                id: profile.id || accessToken,
                name: profile._json.response.user.name,
                username: profile.username || profile.id,
                email: profile.email || "",
                givenName: profile.givenName || "",
                familyName: profile.familyName || "",
                provider: profile.provider || "tumblr",
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