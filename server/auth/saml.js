var passport = require('passport');
var SamlStrategy = require('passport-saml').Strategy;
var SAML = require('passport-saml').SAML;
var fs = require('fs');
var logger = require("../utils/logger");

var setCredentials = function(credentials) {
        var entitiesJSON = JSON.parse(fs.readFileSync('/etc/gluu/conf/passport-saml-config.json', 'utf8'));
        for(key in entitiesJSON){

                logger.info(key);
                var objectJSON = entitiesJSON[key];
                var strategyConfigOptions = {};
                strategyConfigOptions.callbackUrl = global.applicationHost.concat("/passport/auth/saml/"+key+"/callback");
                if(objectJSON.hasOwnProperty('entryPoint')) {
                        strategyConfigOptions.entryPoint = objectJSON['entryPoint'];
                }
                if(objectJSON.hasOwnProperty('issuer')) {
                        strategyConfigOptions.issuer = objectJSON['issuer'];
                }
                if(objectJSON.hasOwnProperty('identifierFormat')) {
                        strategyConfigOptions.identifierFormat = objectJSON['identifierFormat'];
                }
                if(objectJSON.hasOwnProperty('cert')) {
                        strategyConfigOptions.cert = objectJSON['cert'];
                }
                if(objectJSON.hasOwnProperty('skipRequestCompression')) {
                        strategyConfigOptions.skipRequestCompression = objectJSON['skipRequestCompression'];
                }
                if(objectJSON.hasOwnProperty('authnRequestBinding')) {
                        strategyConfigOptions.authnRequestBinding = objectJSON['authnRequestBinding'];
                }
                if(objectJSON.hasOwnProperty('additionalAuthorizeParams')) {
                        strategyConfigOptions.additionalAuthorizeParams = objectJSON['additionalAuthorizeParams'];
                }
                strategyConfigOptions.decryptionPvk = fs.readFileSync('/etc/certs/openldap.key', 'utf-8');
                strategyConfigOptions.passReqToCallback = true;
                var strategy = new SamlStrategy(strategyConfigOptions,
                        function(req, profile, done) {
                                var mapping = objectJSON['reverseMapping'];
                                logger.info(req.body.SAMLResponse);
                                var userProfile = {
                                        id:  profile[mapping["id"]]|| '',
                                        name: profile[mapping["name"]] ||'',
                                        username:  profile[mapping["username"]] || '',
                                        email: profile[mapping["email"]],
                                        givenName: profile[mapping["givenName"]] || '',
                                        familyName: profile[mapping["familyName"]] || '',
                                        provider: profile[mapping["provider"]] || '',
                                        accessToken: "accesstoken"
                                };
                                return done(null, userProfile);
                        });
                passport.use(key,strategy);
                logger.info(key);
                fs.truncate(__dirname + '/../idp-metadata/' + key +'.xml', 0, function() {
                });
                var decryptionCert = fs.readFileSync('/etc/certs/openldap.crt', 'utf-8');
                var metaData = strategy.generateServiceProviderMetadata(decryptionCert);
                fs.writeFile(__dirname + '/../idp-metadata/'+key +'.xml', metaData, function(err) {
                                console.log("Data written successfully for "+key);
                });
        }
};

module.exports = {
passport: passport,
setCredentials: setCredentials
};
