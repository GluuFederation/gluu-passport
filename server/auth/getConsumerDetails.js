var request = require('request-promise');
var fs = require('fs');
var uuid = require('uuid');
var jwt = require('jsonwebtoken');
var configureStrategies = require("./configureStrategies");
var logger = require("../utils/logger");
var www_authenticate = require('www-authenticate');
var parsers = require('www-authenticate').parsers;

var UMAConfigURL = 'https://' + global.config.serverURI + '/.well-known/uma2-configuration';

var ticket, as_URI;
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
                    logger.log('error', 'Error in parsing JSON in getTokenEndpoint: ', JSON.stringify(ex));
                    logger.sendMQMessage('error: Error in parsing JSON in getTokenEndpoint: ' + JSON.stringify(ex));
                    logger.log('error', 'Error received in getTokenEndpoint: ', umaConfigurations.toString());
                    logger.sendMQMessage('error: Error received in getTokenEndpoint: ' + umaConfigurations.toString());
                    reject(umaConfigurations.toString());
                }

                global.UMAConfig = umaConfigurations;
                logger.log('info', 'UMAConfigurations were received');
                logger.sendMQMessage('info: UMAConfigurations were received');
                resolve(global.UMAConfig.token_endpoint);
            })
            .catch(function (error) {
                logger.log('error', 'Error in requesting uma configurations');
                logger.sendMQMessage('error: Error in requesting uma configurations');
                reject(error);
            });
    });
}

function getTicketAndConfig(data) {
    var options = {
        method: 'GET',
        url: global.config.passportConfigAPI

    };

    return new Promise(function (resolve, reject) {
        request(options)
            .then(function (data) {
                try {
                    data = JSON.parse(data);
                } catch (ex) {
                    logger.log('error', 'Error in parsing JSON in getTokenEndpoint: ', JSON.stringify(ex));
                    logger.sendMQMessage('error: Error in parsing JSON in getTokenEndpoint: ' + JSON.stringify(ex));
                    logger.log('error', 'Error received in getTokenEndpoint: ', data.toString());
                    logger.sendMQMessage('error: Error received in getTokenEndpoint: ' + data.toString());
                    reject(data.toString());
                }

                global.UMAConfig = data;
                logger.log('info', 'Passport config were received');
                logger.sendMQMessage('info: Passport config were received');
                resolve(global.UMAConfig.token_endpoint);
            })
            .catch(function (error) {
                if (error.statusCode == 401) {
                    var parsed = new parsers.WWW_Authenticate(error.response.headers['www-authenticate']);
                    logger.sendMQMessage('Got ticket in error header :' + error.response.headers['www-authenticate']);

                    ticket = parsed.parms.ticket;
                    as_URI = parsed.parms.as_uri;
                    resolve(error);

                }
                else {
                    logger.log('error', 'error: Error in getting Passport config. error:' + error);
                    logger.sendMQMessage('error: Error in getting Passport config. error:' + error);
                    reject(data.toString());


                }
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
        aud: global.UMAConfig.token_endpoint,
        jti: uuid(),
        exp: (new Date().getTime() / 1000 + 30),
        iat: (new Date().getTime())
    }, passportCert, options);

    var optionsForRequest = {
        method: 'POST',
        url: global.UMAConfig.token_endpoint,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
            scope: 'uma_authorization',
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: token,
            client_id: clientId,
            ticket: ticket,
            claim_token: null,
            claim_token_format: null,
            pct: null,
            rpt: null,
            scope: null
        }
    };

    return new Promise(function (resolve, reject) {
        request(optionsForRequest)
            .then(function (AATDetails) {
                try {
                    AATDetails = JSON.parse(AATDetails);
                } catch (ex) {
                    logger.log('error', 'Error in parsing JSON in getAAT: ', JSON.stringify(ex));
                    logger.sendMQMessage('error: Error in parsing JSON in getAAT: ' + JSON.stringify(ex));
                    logger.log('error', 'Error received in getAAT: ', AATDetails.toString());
                    logger.sendMQMessage('error: Error received in getAAT: ' + AATDetails.toString());
                    reject(AATDetails.toString());
                }

                if (AATDetails.error) {
                    logger.log('error', 'Error in response from AAT: ', JSON.stringify(AATDetails.error));
                    logger.sendMQMessage('error: Error in response from AAT:: ' + JSON.stringify(AATDetails.error));
                    reject(AATDetails.error);
                }

                logger.log('info', 'AATDetails were received');
                logger.sendMQMessage('info: AATDetails were received');
                resolve(AATDetails);
            })
            .catch(function (error) {
                logger.log('error', 'Error in requesting AAT');
                logger.sendMQMessage('error: Error in requesting AAT');
                reject(error);
            });
    });
}


function getJSON(rpt) {

    var options = {
        method: 'GET',
        url: global.config.passportConfigAPI,
        headers: {
            'authorization': 'Bearer '.concat(rpt.access_token),
            'pct': rpt.pct
        }
    };

    return new Promise(function (resolve, reject) {
        request(options)
            .then(function (passportStrategies) {
                try {
                    passportStrategies = JSON.parse(passportStrategies);
                } catch (ex) {
                    logger.log('error', 'Error in parsing JSON in getJSON: ', JSON.stringify(ex));
                    logger.sendMQMessage('error: Error in parsing JSON in getJSON: ', JSON.stringify(ex));
                    logger.log('error', 'Error received in getJSON: ', passportStrategies.toString());
                    logger.sendMQMessage('error: Error received in getJSON: ', passportStrategies.toString());
                    reject(passportStrategies.toString());
                }

                if (passportStrategies.error) {
                    logger.log('error', 'Error in response from getJSON: ', JSON.stringify(passportStrategies.error));
                    logger.sendMQMessage('error: Error in response from getJSON: ', JSON.stringify(passportStrategies.error));
                    reject(passportStrategies.error);
                }
                logger.log('info', 'Passport strategies were received');
                logger.sendMQMessage('info: Passport strategies were received');
                configureStrategies.setConfiguratins(passportStrategies);
                resolve(passportStrategies);
            })
            .catch(function (error) {
                logger.log('error', 'Error in requesting getJSON');
                logger.sendMQMessage('error: Error in requesting getJSON');
                reject(error);
            });
    });
}

exports.getDetailsAndConfigureStrategies = function (callback) {
    getTokenEndpoint(UMAConfigURL)
        .then(function (data) {
            return getTicketAndConfig(data);
        })
        .then(function (umaConfigurations) {
            return getAAT(umaConfigurations);
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
