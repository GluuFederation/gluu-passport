var getConsumerDetails = require('./getConsumerDetails');

var FacebookStrategy = require('./facebook');
var GitHubStrategy = require('./github');
var GoogleStrategy = require('./google');
var LinkedinStrategy = require('./linkedin');
var TumblrStrategy = require('./tumblr');
var TwitterStrategy = require('./twitter');
var YahooStrategy = require('./yahoo');

exports.setConfiguratins = function(data){
    if (data) {
        if (data.applicationEndpoint) {
            global.applicationEndpoint = data.applicationEndpoint;
        }
        if (data.applicationStartpoint) {
            global.applicationStartpoint = data.applicationStartpoint;
        }

        //FacebookStrategy
        if (data.passportStrategies.facebook) {
            FacebookStrategy.setCredentials(data.passportStrategies.facebook);
        }
        //GitHubStrategy
        if (data.passportStrategies.github) {
            GitHubStrategy.setCredentials(data.passportStrategies.github);
        }

        //GoogleStrategy
        if (data.passportStrategies.google) {
            GoogleStrategy.setCredentials(data.passportStrategies.google);
        }

        //LinkedinStrategy
        if (data.passportStrategies.linkedin) {
            LinkedinStrategy.setCredentials(data.passportStrategies.linkedin);
        }

        //TumblrStrategy
        if (data.passportStrategies.tumblr) {
            TumblrStrategy.setCredentials(data.passportStrategies.tumblr);
        }

        //TwitterStrategy
        if (data.passportStrategies.twitter) {
            TwitterStrategy.setCredentials(data.passportStrategies.twitter);
        }

        //YahooStrategy
        if (data.passportStrategies.yahoo) {
            YahooStrategy.setCredentials(data.passportStrategies.yahoo);
        }

    } else {
        console.log("Error in getting data, error: ", err);
    }
}
