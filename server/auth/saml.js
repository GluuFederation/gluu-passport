var passport = require('passport');
var SamlStrategy = require('passport-saml').Strategy;
var SAML = require('passport-saml').SAML;
var fs = require('fs');
var logger = require("../utils/logger");
var path = require('path');

var setCredentials = function () {
    var entitiesJSON = global.saml_config;
    var inboundEntitiesJSON = global.saml_idp_init_config;
    for (let key in entitiesJSON) {

        logger.log2('verbose', 'Generating metadata for SAML provider "%s"', key)
        var objectJSON = entitiesJSON[key];
        var inboundJSON = inboundEntitiesJSON[key];
        var strategyConfigOptions = {};
        strategyConfigOptions.callbackUrl = global.applicationHost.concat("/passport/auth/saml/" + key + "/callback");
        if (inboundJSON) {
            strategyConfigOptions.callbackUrl = strategyConfigOptions.callbackUrl + "/inbound"
        }

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
        } else {
            logger.log2('warn', '"cert" property is not present. Provider "%s" will not work', key)
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
                logger.log2('verbose', 'Initial profile: %s', JSON.stringify(profile))
                var idp = req.originalUrl.replace("/passport/auth/saml/","").replace("/callback","").replace("/inbound","");
                var mapping = global.saml_config[idp].reverseMapping;
                logger.log2('debug', 'SAML reponse in body:\n%s', req.body.SAMLResponse)

                var userProfile = {
                    id: profile[mapping["id"]] || '',
                    memberOf: profile[mapping["memberOf"]] || '',
                    name: profile[mapping["name"]] || '',
                    username: profile[mapping["username"]] || '',
                    email: profile[mapping["email"]],
                    givenName: profile[mapping["givenName"]] || '',
                    familyName: profile[mapping["familyName"]] || '',
                    provider: profile[mapping["provider"]] || '',
                    providerKey: key
                };
                logger.log2('verbose', 'Profile after mapping: %s', JSON.stringify(userProfile))

                return done(null, userProfile);
            });

        passport.use(key, strategy);

        var idpMetaPath = path.join(__dirname, '..', 'idp-metadata');
        if (!fs.existsSync(idpMetaPath)) {
            fs.mkdirSync(idpMetaPath);
        }

        fs.truncate(path.join(idpMetaPath, key + '.xml'), 0, function (err) { });
        var decryptionCert = fs.readFileSync('/etc/certs/passport-sp.crt', 'utf-8');

        var metaData = strategy.generateServiceProviderMetadata(decryptionCert);
        logger.log2('debug', 'Metadata is:\n%s', metaData)

        fs.writeFile(path.join(idpMetaPath, key + '.xml'), metaData, function (err) {
            if (err) {
                logger.log2('error', 'Failed saving %s', path.join(idpMetaPath, key + '.xml'))
                logger.log2('error', err)
            } else {
                logger.log2('info', '%s saved successfully', path.join(idpMetaPath, key + '.xml'))
            }
        })
    }
};

module.exports = {
    passport: passport,
    setCredentials: setCredentials
};
