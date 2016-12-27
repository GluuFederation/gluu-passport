var request = require('request-promise');
var fs = require('fs');
var uuid = require('uuid');
var jwt = require('jsonwebtoken');
var configureStrategies = require("./configureStrategies");
var logger = require("../utils/logger");

var UMAConfigURL = 'https://' + global.config.serverURI + '/.well-known/uma-configuration';

Promise = require('bluebird');

function getTokenEndpoint(UMAConfigURL) {
    var options = {
        method: 'GET',
        url: UMAConfigURL
    };

    return new Promise(function (resolve, reject) {
        request(options)
            .then(function (umaConfigurations) {
                try {
                    umaConfigurations = JSON.parse(umaConfigurations);
                } catch (ex) {
                    logger.log('error', "Error in parsing JSON in getTokenEndpoint: ", JSON.stringify(ex));
                    logger.log('error', "Error received in getTokenEndpoint: ", umaConfigurations.toString());
                    reject(umaConfigurations.toString());
                }

                global.UMAConfig = umaConfigurations;
                logger.log('info', "UMAConfigurations were received");
                resolve(global.UMAConfig.token_endpoint);
            })
            .catch(function (error) {
                logger.log('error', "Error in requesting uma configurations");
                reject(error);
            });
    });
}

function getAAT(token_endpoint) {

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

    return new Promise(function (resolve, reject) {
        request(optionsForRequest)
            .then(function (AATDetails) {
                try {
                    AATDetails = JSON.parse(AATDetails);
                } catch (ex) {
                    logger.log('error', "Error in parsing JSON in getAAT: ", JSON.stringify(ex));
                    logger.log('error', "Error received in getAAT: ", AATDetails.toString());
                    reject(AATDetails.toString());
                }

                if (AATDetails.error) {
                    logger.log('error', "Error in response from ATT: ", JSON.stringify(AATDetails.error));
                    reject(AATDetails.error);
                }

                logger.log('info', "ATTDetails were received");
                resolve(AATDetails);
            })
            .catch(function (error) {
                logger.log('error', "Error in requesting ATT");
                reject(error);
            });
    });
}

function getGAT(AATDetails) {

    var accessToken = AATDetails.access_token;
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

    return new Promise(function (resolve, reject) {
        request(options)
            .then(function (GATDetails) {
                try {
                    GATDetails = JSON.parse(GATDetails);
                } catch (ex) {
                    logger.log('error', "Error in parsing JSON in getGAT: ", JSON.stringify(ex));
                    logger.log('error', "Error received in getGAT: ", GATDetails.toString());
                    reject(GATDetails.toString());
                }

                var rpt = GATDetails.rpt;
                logger.log('info', "rpt was received");
                resolve(rpt);
            })
            .catch(function (error) {
                logger.log('error', "Error in requesting GAT");
                reject(error);
            });
    });
}

function getJSON(rpt) {

    var options = {
        method: 'GET',
        url: global.config.passportConfigAPI,
        headers: {
            'authorization': 'Bearer '.concat(rpt)
        }
    };

    return new Promise(function (resolve, reject) {
        request(options)
            .then(function (passportStrategies) {
                try {
                    passportStrategies = JSON.parse(passportStrategies);
                } catch (ex) {
                    logger.log('error', "Error in parsing JSON in getJSON: ", JSON.stringify(ex));
                    logger.log('error', "Error received in getJSON: ", passportStrategies.toString());
                    reject(passportStrategies.toString());
                }

                if (passportStrategies.error) {
                    logger.log('error', "Error in response from getJSON: ", JSON.stringify(passportStrategies.error));
                    reject(passportStrategies.error);
                }
                logger.log('info', "Passport strategies were received");
                configureStrategies.setConfiguratins(passportStrategies);
                resolve(passportStrategies);
            })
            .catch(function (error) {
                logger.log('error', "Error in requesting getJSON");
                reject(error);
            });
    });
}

exports.getDetailsAndConfigureStrategies = function(callback){
    getTokenEndpoint(UMAConfigURL)
        .then(function (umaConfigurations) {
            return getAAT(umaConfigurations);
        })
        .then(function (AATDetails) {
            return getGAT(AATDetails);
        })
        .then(function (rpt) {
            return getJSON(rpt);
        })
        .then(function (passportStrategies) {
            configureStrategies.setConfiguratins(passportStrategies);
            callback(null, passportStrategies);
        })
        .catch(function (error) {
            callback(error, null);
        });
};