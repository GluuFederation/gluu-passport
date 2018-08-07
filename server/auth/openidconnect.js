var passport = require('passport');
var passport = new passport.Passport()
var OIDCStrategy = require('passport-openidconnect').Strategy

var setCredentials = function(credentials) {
	var callbackURL = global.applicationHost.concat("/passport/auth/openidconnect/callback")
	//credentials object is assumed to already have populated the properties: issuer, authorizationURL, tokenURL, userInfoURL, clientID, clientSecret
	//please fill any missing via oxTrust: Configuration > Manage Authentication > Passport authentication method
	credentials.callbackURL= callbackURL
	credentials.scope = 'profile user_name email'

	passport.use(new OIDCStrategy(credentials,
		function(iss, sub, profile, accessToken, refreshToken, done) {
			var userProfile = {
				id: profile.id || "",
				name: profile.displayName || "",
				username: profile._json.user_name || profile.id || "",
				email: profile._json.email || "",
				givenName: profile.name.givenName || "",
				familyName: profile.name.familyName || "",
				provider: "openidconnect"
			}
			return done(null, userProfile)
		}
	))
}

module.exports = {
	passport: passport,
	setCredentials: setCredentials
}