var request = require("request");
var fs = require('fs');
var uuid = require('uuid');
var jwt = require('jsonwebtoken');
var configureStrategies = require("./configureStrategies");
var logger = require("../utils/logger");

var UMAConfigURL = 'https://' + global.config.serverURI + '/.well-known/uma-configuration';

exports.getTokenEndpoint = function (callback) {
    var options = {
        method: 'GET',
        url: UMAConfigURL
    };

    request(options, function (error, response, body) {

        if (error) {
            logger.log('error', "Error in requesting uma configurations");
            return callback(error, null);
        }

        try {
            body = JSON.parse(body);
        } catch (ex) {
            logger.log('error', "Error in parsing JSON in getTokenEndpoint: ", JSON.stringify(ex));
            return callback(ex, null);
        }

        global.UMAConfig = body;
        logger.log('info', "UMAConfigurations were received");
        getATT(global.UMAConfig.token_endpoint, function (err, data) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, data);
        });
    });
};

function getATT(token_endpoint, callback) {

    var passportCert = fs.readFileSync(global.config.keyPath, 'utf8'); // get private key and replace headers to sign jwt
    passportCert = passportCert.replace("-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----");
    passportCert = passportCert.replace("-----END RSA PRIVATE KEY-----", "-----END PRIVATE KEY-----");

    var clientId = global.config.clientId;
    var options = {
        algorithm: global.config.keyAlg,
        header: {
            "typ": "JWT",
            "alg": global.config.keyAlg,
            "kid": global.config.keyId
        }
    };
    var token = jwt.sign({
        iss: clientId,
        sub: clientId,
        aud: token_endpoint,
        jti: uuid(),
        exp: (new Date().getTime() / 1000 + 30),
        iat: (new Date().getTime())
    }, passportCert, options);

    var optionsForRequest = {
        method: 'POST',
        url: token_endpoint,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: 'client_credentials',
            scope: 'uma_authorization',
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: token,
            client_id: clientId
        }
    };

    request(optionsForRequest, function (error, response, body) {

        if (error) {
            logger.log('error', "Error in requesting ATT");
            return callback(error, null);
        }

        try {
            body = JSON.parse(body);
        } catch (ex) {
            logger.log('error', "Error in parsing JSON in getATT: ", JSON.stringify(ex));
            return callback(ex, null);
        }

        if (body.error) {
            logger.log('error', "Error in response from ATT: ", JSON.stringify(body.error));
            return callback(body.error, null);
        }

        logger.log('info', "ATTDetails were received");
        getGAT(body, function (err, data) {
            if (err) {
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
        url: global.UMAConfig.gat_endpoint,
        headers: {
            'content-type': 'application/json',
            gat: 'true',
            authorization: 'Bearer '.concat(accessToken)
        },
        body: JSON.stringify({ scopes: [global.config.umaScope] })
    };
    request(options, function (error, response, body) {

        if (error) {
            logger.log('error', "Error in requesting GAT");
            return callback(error, null);
        }

        try {
            body = JSON.parse(body);
        } catch (ex) {
            logger.log('error', "Error in parsing JSON in getGAT: ", JSON.stringify(ex));
            return callback(ex, null);
        }

        var rpt = body.rpt;
        logger.log('info', "rpt was received");
        getJSON(rpt, function (err, data) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, data);
        });
    });
}

function getJSON(rpt, onResult) {

    var options = {
        method: 'GET',
        url: global.config.passportConfigAPI,
        headers: {
            'authorization': 'Bearer '.concat(rpt)
        }
    };
    request(options, function (error, response, body) {

        if (error) {
            logger.log('error', "Error in requesting getJSON");
            return onResult(error, null);
        }

        try {
            body = JSON.parse(body);
        } catch (ex) {
            logger.log('error', "Error in parsing JSON in getJSON: ", JSON.stringify(ex));
            return onResult(ex, null);
        }

        if (body.error) {
            logger.log('error', "Error in response from getJSON: ", JSON.stringify(body.error));
            return onResult(body.error, null);
        }
        logger.log('info', "Passport strategies were received");
        configureStrategies.setConfiguratins(body);
        return onResult(null, body);

    });
}
