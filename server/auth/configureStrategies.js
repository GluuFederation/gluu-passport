var FacebookStrategy = require('./facebook');
var GitHubStrategy = require('./github');
var GoogleStrategy = require('./google');
var LinkedinStrategy = require('./linkedin');
var TumblrStrategy = require('./tumblr');
var TwitterStrategy = require('./twitter');
var YahooStrategy = require('./yahoo');
var SamlStrategy = require("./saml");
var logger = require("../utils/logger");

global.getpassportStrategies = null;

exports.setConfiguratins = function(data){
    SamlStrategy.setCredentials();
    getpassportStrategies = data.passportStrategies;
    if (data && data.passportStrategies) {

        //FacebookStrategy
        if (data.passportStrategies.facebook) {
            logger.log('info', 'Facebook Strategy details received');
            logger.sendMQMessage('info: Facebook Strategy details received');
            FacebookStrategy.setCredentials(data.passportStrategies.facebook);
        }

        //GitHubStrategy
        if (data.passportStrategies.github) {
            logger.log('info', 'Github Strategy details received');
            logger.sendMQMessage('info: Github Strategy details received');
            GitHubStrategy.setCredentials(data.passportStrategies.github);
        }

        //GoogleStrategy
        if (data.passportStrategies.google) {
            logger.log('info', 'Google Strategy details received');
            logger.sendMQMessage('info: Google Strategy details received');
            GoogleStrategy.setCredentials(data.passportStrategies.google);
        }

        //LinkedinStrategy
        if (data.passportStrategies.linkedin) {
            logger.log('info', 'LinkedIn Strategy details received');
            logger.sendMQMessage('info: LinkedIn Strategy details received');
            LinkedinStrategy.setCredentials(data.passportStrategies.linkedin);
        }

        //TumblrStrategy
        if (data.passportStrategies.tumblr) {
            logger.log('info', 'Tumblr Strategy details received');
            logger.sendMQMessage('info: Tumblr Strategy details received');
            TumblrStrategy.setCredentials(data.passportStrategies.tumblr);
        }

        //TwitterStrategy
        if (data.passportStrategies.twitter) {
            logger.log('info', 'Twitter Strategy details received');
            logger.sendMQMessage('info: Twitter Strategy details received');
            TwitterStrategy.setCredentials(data.passportStrategies.twitter);
        }

        //YahooStrategy
        if (data.passportStrategies.yahoo) {
            logger.log('info', 'Yahoo Strategy details received');
            logger.sendMQMessage('info: Yahoo Strategy details received');
            YahooStrategy.setCredentials(data.passportStrategies.yahoo);
        }
        //SamlStrategy
        if (data.passportStrategies.saml) {
            logger.log('info', 'Saml Strategy details received');
            logger.sendMQMessage('info: Saml Strategy details received');
        }

    } else {
        logger.log('error', 'Error in getting data, error: ' + JSON.stringify(err));
        logger.sendMQMessage('error: Error in getting data, error: ' + JSON.stringify(err));
    }
};
