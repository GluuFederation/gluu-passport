var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var passportLinkedIn = require('../auth/linkedin').passport;
var passportGithub = require('../auth/github').passport;
var passportTwitter = require('../auth/twitter').passport;
var passportFacebook = require('../auth/facebook').passport;
var passportTumblr = require('../auth/tumblr').passport;
var passportYahoo = require('../auth/yahoo').passport;
var passportGoogle = require('../auth/google').passport;
var passportWindowsLive = require('../auth/windowslive').passport;
var passportDropbox = require('../auth/dropbox').passport;
var logger = require("../utils/logger");
var passportSAML = require('../auth/saml').passport;
var fs = require('fs');
var uuid = require('uuid');

var response_part1 = "<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\">\n    <head>\n        </head>\n    <body onload=\"document.forms[0].submit()\">\n        <noscript>\n            <p>\n                <strong>Note:</strong> Since your browser does not support JavaScript,\n                you must press the Continue button once to proceed.\n            </p>\n        </noscript>\n        \n        <form action=\"";
var response_part2 = "\" method=\"post\">\n            <div>\n                                \n                                \n                <input type=\"hidden\" name=\"user\" value=\"";
var response_part3 = "\"/>                \n            </div>\n            <noscript>\n                <div>\n                    <input type=\"submit\" value=\"Continue\"/>\n                </div>\n            </noscript>\n        </form>\n            </body>\n</html>";

var validateToken = function (req, res, next) {

    var token = req.body && req.body.token || req.params && req.params.token || req.headers['x-access-token'];
    if (token) {
        // verifies secret and checks expiration of token
        jwt.verify(token, global.applicationSecretKey, function (err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                return next();
            }
        });

    } else {

        // if there is no token
        // returning an error
        return res.redirect(global.config.applicationStartpoint + '?failure=No token provided');
    }
};

function getUserJwt(data, subject) {
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
        sub: subject,
        aud: global.config.applicationEndpoint,
        jti: uuid(),
        exp: (new Date().getTime() / 1000 + 30),
        iat: (new Date().getTime()),
        data: data
    }, passportCert, options);

    return token;
}

var callbackResponse = function (req, res) {
    if (!req.user) {
        return res.redirect(global.config.applicationStartpoint + '?failure=Unauthorized');
    }
    logger.log('info', 'User authenticated with: ' + req.user.provider + 'Strategy with userid: ' + req.user.id);
    logger.sendMQMessage('info: User authenticated with: ' + req.user.provider + 'Strategy with userid: ' + req.user.id);
    var jwt = getUserJwt(req.user, req.user.id);
    logger.log('info', 'Preparing to send user data to: ' + global.config.applicationEndpoint + ' with JWT=' + jwt);
    var response_body = response_part1 + global.config.applicationEndpoint + response_part2 + jwt + response_part3;
    res.set('content-type', 'text/html;charset=UTF-8');
    return res.send(response_body);

};

router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Node-Passport'
    });
});

router.get('/login', function (req, res, next) {
    res.redirect(global.config.applicationStartpoint + '?failure=Go back and register!');
});

//=================== linkedin =================
router.get('/auth/linkedin/callback',
    passportLinkedIn.authenticate('linkedin', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/linkedin/:token',
    validateToken,
    passportLinkedIn.authenticate('linkedin'));

//===================== github =================
router.get('/auth/github/callback',
    passportGithub.authenticate('github', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/github/:token',
    validateToken,
    passportGithub.authenticate('github', {
        scope: ['user:email']
    }));

//==================== twitter =================
router.use('/auth/twitter/callback',
    passportTwitter.authenticate('twitter', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/twitter/:token',
    validateToken,
    passportTwitter.authenticate('twitter'));

//==================== facebook ================
router.get('/auth/facebook/callback',
    passportFacebook.authenticate('facebook', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/facebook/:token',
    validateToken,
    passportFacebook.authenticate('facebook', {
        scope: ['email']
    }));

//===================== tumblr =================
router.get('/auth/tumblr/callback',
    passportTumblr.authenticate('tumblr', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/tumblr/:token',
    validateToken,
    passportTumblr.authenticate('tumblr'));

//===================== yahoo =================
router.get('/auth/yahoo/callback',
    passportYahoo.authenticate('yahoo', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/yahoo/:token',
    validateToken,
    passportYahoo.authenticate('yahoo'));

//===================== google =================
router.get('/auth/google/callback',
    passportGoogle.authenticate('google', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/google/:token',
    validateToken,
    passportGoogle.authenticate('google', {
        scope: ['profile', 'email']
    }));

//================== windowslive ===============
router.get('/auth/windowslive/callback',
    passportWindowsLive.authenticate('windowslive', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/windowslive/:token',
    validateToken,
    passportWindowsLive.authenticate('windowslive'));

//================== dropbox ==================
router.get('/auth/dropbox/callback',
    passportDropbox.authenticate('dropbox-oauth2', {
        failureRedirect: '/passport/login'
    }),
    callbackResponse);

router.get('/auth/dropbox/:token',
    validateToken,
    passportDropbox.authenticate('dropbox-oauth2'));

//===================saml ====================
var entitiesJSON = global.saml_config;
for (key in entitiesJSON) {

    if (entitiesJSON[key].cert && entitiesJSON[key].cert.length > 5 && entitiesJSON[key].enable.match("true")) {
        router.post('/auth/saml/' + key + '/callback',
            passportSAML.authenticate(key, {
                failureRedirect: '/passport/login'
            }),
            callbackResponse);

        router.get('/auth/saml/' + key + '/:token',
            validateToken,
            passportSAML.authenticate(key));
    }
    else {
        router.get('/auth/saml/' + key + '/:token',
            validateToken,
            function (req, res) {
                err = {
                    message: "cert param is required to validate signature of saml assertions response"
                };
                logger.log('error', 'Cert Error: ' + JSON.stringify(err));
                logger.sendMQMessage('Cert Error: ' + JSON.stringify(err));
                res.status(400).send("Internal Error");
            });
    }
}

router.get("/saml_config", function (req, res) {

    const res_str = JSON.stringify(global.saml_config);
    var tmp = JSON.parse(res_str);
    for (v in tmp) {
        tmp[v].entryPoint = "";
        tmp[v].issuer = "";
        tmp[v].identifierFormat = "";
        tmp[v].authnRequestBinding = "";
        tmp[v].additionalAuthorizeParams = "";
        tmp[v].cert = "";
    }
    res.status(200).send(JSON.stringify(tmp));
});


router.get('/passportstrategies',
    function (req, res) {
        const res_str = JSON.stringify(global.getpassportStrategies);
        var tmp = JSON.parse(res_str);
        for (v in tmp) {
            tmp[v].clientID = "";
            tmp[v].clientSecret = "";
        }
        res.status(200).send(JSON.stringify(tmp));
    });


router.get('/auth/meta/idp/:idp',
    function (req, res) {
        var idp = req.params.idp;
        logger.info(idp);
        fs.readFile(__dirname + '/../idp-metadata/' + idp + '.xml', (e, data) => {
            if(e)
            res.status(404).send("Internal Error");
    else
        res.status(200).set('Content-Type', 'text/xml').send(String(data));
    })
        ;
    });

//======== catch 404 and forward to login ========
router.all('/*', function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.redirect(global.config.applicationStartpoint + '?failure=The requested resource does not exists!');
});

module.exports = router;
