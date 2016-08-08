var getConsumerDetails = require('./getConsumerDetails');

var FacebookStrategy = require('./facebook');
var GitHubStrategy = require('./github');
var GoogleStrategy = require('./google');
var LinkedinStrategy = require('./linkedin');
var TumblrStrategy = require('./tumblr');
var TwitterStrategy = require('./twitter');
var YahooStrategy = require('./yahoo');

var options = {
    host: '192.168.200.67',
    port: 7777,
    path: '/authCreds',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

exports.setConfiguratins = function(){
    getConsumerDetails.getJSON(options, function(err, data) {
        if (!err) {
            if (data.hostname) {
                global.hostname = data.hostname;
            }
            if (data.applicationEndpoint) {
                global.applicationEndpoint = data.applicationEndpoint;
            }
            if (data.applicationStartpoint) {
                global.applicationStartpoint = data.applicationStartpoint;
            }

            //FacebookStrategy
            if (data.facebook) {
                FacebookStrategy.setCredentials(data.facebook);
            }
            //GitHubStrategy
            if (data.github) {
                GitHubStrategy.setCredentials(data.github);
            }

            //GoogleStrategy
            if (data.google) {
                GoogleStrategy.setCredentials(data.google);
            }

            //LinkedinStrategy
            if (data.linkedin) {
                LinkedinStrategy.setCredentials(data.linkedin);
            }

            //TumblrStrategy
            if (data.tumblr) {
                TumblrStrategy.setCredentials(data.tumblr);
            }

            //TwitterStrategy
            if (data.twitter) {
                TwitterStrategy.setCredentials(data.twitter);
            }

            //YahooStrategy
            if (data.yahoo) {
                YahooStrategy.setCredentials(data.yahoo);
            }

        } else {
            console.log("Error in getting data, error: ", err);
        }
    });
}
