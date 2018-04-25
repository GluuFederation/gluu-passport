var passport = require('passport');
var SamlStrategy = require('passport-saml').Strategy;
var SAML = require('passport-saml').SAML;
var fs = require('fs');
var logger = require("../utils/logger");
var path = require('path');

var setCredentials = function () {
    var entitiesJSON = global.saml_config;
    for (key in entitiesJSON) {

        logger.info(key);
        var objectJSON = entitiesJSON[key];
        var strategyConfigOptions = {};
        strategyConfigOptions.callbackUrl = global.applicationHost.concat("/passport/auth/saml/" + key + "/callback");
        if (objectJSON.hasOwnProperty('entryPoint')) {
            strategyConfigOptions.entryPoint = objectJSON['entryPoint'];
        }
        if (objectJSON.hasOwnProperty('issuer')) {
            strategyConfigOptions.issuer = objectJSON['issuer'];
        }
        if (objectJSON.hasOwnProperty('identifierFormat')) {
            strategyConfigOptions.identifierFormat = objectJSON['identifierFormat'];
        }
        if (objectJSON.hasOwnProperty('cert')) {
            strategyConfigOptions.cert = objectJSON['cert'];
        }
        else {
            logger.info('"cert"  is not present so' + key + " will not work" +objectJSON);
            return
        }
        if (objectJSON.hasOwnProperty('skipRequestCompression')) {
            strategyConfigOptions.skipRequestCompression = objectJSON['skipRequestCompression'];
        }
        if (objectJSON.hasOwnProperty('authnRequestBinding')) {
            strategyConfigOptions.authnRequestBinding = objectJSON['authnRequestBinding'];
        }
        if (objectJSON.hasOwnProperty('additionalAuthorizeParams')) {
            strategyConfigOptions.additionalAuthorizeParams = objectJSON['additionalAuthorizeParams'];
        }
        if(objectJSON.hasOwnProperty('forceAuthn')){
            strategyConfigOptions.forceAuthn = objectJSON['forceAuthn'];
        }
        if(objectJSON.hasOwnProperty('providerName')){
            strategyConfigOptions.providerName = objectJSON['providerName'];
        }
        if(objectJSON.hasOwnProperty('signatureAlgorithm')){
            strategyConfigOptions.signatureAlgorithm = objectJSON['signatureAlgorithm'];
        }
        if(objectJSON.hasOwnProperty('requestIdExpirationPeriodMs')){
            strategyConfigOptions.requestIdExpirationPeriodMs = objectJSON['requestIdExpirationPeriodMs'];
        }
        else {
            strategyConfigOptions.requestIdExpirationPeriodMs = 3600000;

        }

        strategyConfigOptions.decryptionPvk = fs.readFileSync('/etc/certs/passport-sp.key', 'utf-8');
        strategyConfigOptions.passReqToCallback = true;
        strategyConfigOptions.validateInResponseTo = true;

        var strategy = new SamlStrategy(strategyConfigOptions,
            function (req, profile, done) {
                logger.info("profile : "+profile);
                var idp = req.originalUrl.replace("/passport/auth/saml/","").replace("/callback","");
                var mapping =global.saml_config[idp].reverseMapping;
                logger.info(req.body.SAMLResponse);
                logger.info("mapping : "+mapping);
                var userProfile = {
                    id: profile[mapping["id"]] || '',
                    memberOf: profile[mapping["memberOf"]] || '',
                    name: profile[mapping["name"]] || '',
                    username: profile[mapping["username"]] || '',
                    email: profile[mapping["email"]],
                    givenName: profile[mapping["givenName"]] || '',
                    familyName: profile[mapping["familyName"]] || '',
                    provider: profile[mapping["provider"]] || '',
                    accessToken: "accesstoken"
                };
                return done(null, userProfile);
            });
        passport.use(key, strategy);

        var idpMetaPath = path.join(__dirname, '..', 'idp-metadata');
        if (!fs.existsSync(idpMetaPath)) {
            fs.mkdirSync(idpMetaPath);
        }

        fs.truncate(path.join(idpMetaPath, key + '.xml'), 0, function (err) {

        });
        var decryptionCert = fs.readFileSync('/etc/certs/passport-sp.crt', 'utf-8');

        var metaData = strategy.generateServiceProviderMetadata(decryptionCert);
        logger.info(metaData);

        fs.writeFile(path.join(idpMetaPath, key + '.xml'), metaData, function (err) {
            if (err) {
                logger.info("failed to save" + path.join(idpMetaPath, key + '.xml' +"error :"+err));
            } else {
                logger.info("succeeded in saving" + path.join(idpMetaPath, key + '.xml'));
            }
        })
    }
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
};
