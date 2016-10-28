var http = require("http");
var request = require("request");
var configureStrategies = require("./configureStrategies");
function getJSON(rpt, onResult) {
    var options = {
        method: 'POST',
        url: 'https://ce-dev.gluu.org/identity/seam/resource/restv1/passportconfig/',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            access_token: rpt
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            return onResult(error, null);
        }

        configureStrategies.setConfiguratins(JSON.parse(body));
        return onResult(null, body);

    });
}

exports.getATT = function (callback) {

    var username = "@!5A58.AE0D.D383.1E46!0001!E38B.7DBE!0008!BB95.73E1";
    var password = "passport";
    var toEncode = username.concat(":",password);
    var basicToken = new Buffer(toEncode).toString('base64');
    var options = {
        method: 'POST',
        url: 'https://ce-dev.gluu.org/oxauth/seam/resource/restv1/oxauth/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            authorization: 'Basic'.concat(" ", basicToken)
        },
        form: {
            grant_type: 'client_credentials',
            scope: 'uma_authorization'
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            return callback(error, null);
        }
        var ATTDetails = JSON.parse(body);
        getGAT(ATTDetails, function (err, data) {
            if(err){
                return callback(err, null);
            }
            return callback(null, data);
        });
    });
}

function getGAT(ATTDetails, callback) {

    var accessToken = ATTDetails.access_token;
    var options = {
        method: 'POST',
        url: 'https://ce-dev.gluu.org/oxauth/seam/resource/restv1/requester/gat',
        headers:
        {
            'content-type': 'application/json',
            gat: 'true',
            authorization: 'Bearer '.concat(accessToken)
        },
        body: {
            scopes: [ 'uma_authorization' ]
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            return callback(error, null);
        }
        var rpt = body.rpt;
        getJSON(rpt, function (err, data) {
            if(err){
                return callback(err, null);
            }
            return callback(null, data);
        });
    });
}