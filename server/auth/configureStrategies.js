var FacebookStrategy = require('./facebook');
var GitHubStrategy = require('./github');
var GoogleStrategy = require('./google');
var LinkedinStrategy = require('./linkedin');
var TumblrStrategy = require('./tumblr');
var TwitterStrategy = require('./twitter');
var YahooStrategy = require('./yahoo');
var DropboxOAuth2Strategy = require('./dropbox');
var OIDCStrategy = require('./openidconnect')
var SamlStrategy = require("./saml");
var logger = require("../utils/logger")

global.getpassportStrategies = null;

exports.setConfigurations = function(data){

    SamlStrategy.setCredentials();
    getpassportStrategies = data.passportStrategies;
    if (data && data.passportStrategies) {

        //FacebookStrategy
        if (data.passportStrategies.facebook) {
			logger.log2('info', 'Facebook Strategy details received')
            FacebookStrategy.setCredentials(data.passportStrategies.facebook)
        }

        //GitHubStrategy
        if (data.passportStrategies.github) {
			logger.log2('info', 'Github Strategy details received')
            GitHubStrategy.setCredentials(data.passportStrategies.github)
        }

        //DropboxOAuth2Strategy
        if (data.passportStrategies.dropbox) {
			logger.log2('info', 'DropboxOAuth2 Strategy details received')
            DropboxOAuth2Strategy.setCredentials(data.passportStrategies.dropbox)
        }

        //GoogleStrategy
        if (data.passportStrategies.google) {
			logger.log2('info', 'Google Strategy details received')
            GoogleStrategy.setCredentials(data.passportStrategies.google)
        }

        //LinkedinStrategy
        if (data.passportStrategies.linkedin) {
			logger.log2('info', 'LinkedIn Strategy details received')
            LinkedinStrategy.setCredentials(data.passportStrategies.linkedin)
        }

        //TumblrStrategy
        if (data.passportStrategies.tumblr) {
			logger.log2('info', 'Tumblr Strategy details received')
            TumblrStrategy.setCredentials(data.passportStrategies.tumblr)
        }

        //TwitterStrategy
        if (data.passportStrategies.twitter) {
			logger.log2('info', 'Twitter Strategy details received')
            TwitterStrategy.setCredentials(data.passportStrategies.twitter)
        }

        //YahooStrategy
        if (data.passportStrategies.yahoo) {
			logger.log2('info', 'Yahoo Strategy details received')
            YahooStrategy.setCredentials(data.passportStrategies.yahoo)
        }

        //OIDCStrategy
        if (data.passportStrategies.openidconnect) {
			logger.log2('info', 'OIDC details received')
            OIDCStrategy.setCredentials(data.passportStrategies.openidconnect)
        }

        //SamlStrategy
        if (data.passportStrategies.saml) {
			logger.log2('info', 'Saml Strategy details received')
        }

    } else {
        logger.log2('error', 'Error in getting data: %s', JSON.stringify(err))
    }
};
