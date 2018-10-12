var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var util = require('util')

var passportLinkedIn = require('../auth/linkedin').passport;
var passportGithub = require('../auth/github').passport;
var passportTwitter = require('../auth/twitter').passport;
var passportFacebook = require('../auth/facebook').passport;
var passportTumblr = require('../auth/tumblr').passport;
var passportYahoo = require('../auth/yahoo').passport;
var passportGoogle = require('../auth/google').passport;
var passportWindowsLive = require('../auth/windowslive').passport;
var passportDropbox = require('../auth/dropbox').passport;
var passportSAML = require('../auth/saml').passport;
var passportOIDC = require('../auth/openidconnect').passport

var fs = require('fs');
var uuid = require('uuid');
var logger = require("../utils/logger")
var misc = require('../utils/misc')
var openid = require('../openid/openid')

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
        // if there is no token, return an error
        return res.redirect(global.config.applicationStartpoint + '?failure=No token provided');
    }
};

var casaCallback = function (req, res) {

	var provider = req.params.provider
	res.cookie('casa-' + provider, req.decoded.exp, {
		httpOnly: true,
		maxAge: 120000,	//2min expiration
		secure: true
		})
	var obj

	switch (provider) {
		case 'github':
			obj = passportGithub
			break
		case 'twitter':
			obj = passportTwitter
			break
		case 'facebook':
			obj = passportFacebook
			break
		case 'tumblr':
			obj = passportTumblr
			break
		case 'yahoo':
			obj = passportYahoo
			break
		case 'google':
			obj = passportGoogle
			break
		case 'windowslive':
			obj = passportWindowsLive
			break
		case 'dropbox':
			obj = passportDropbox
			break
		case 'openidconnect':
			obj = passportOIDC
			break
	}
	if (!obj) {
		res.redirect(util.format('/casa/rest/idp-linking?failure=Provider %s not recognized in passport-casa mapping', provider))
	} else {
		logger.log2('verbose', 'At casaCallback, proceeding with linking procedure for provider %s', provider)
		obj.authenticate(provider, { failureRedirect: '/passport/login' })(req,res)
	}

}

var callbackResponse = function (req, res) {

    if (!req.user) {
        return res.redirect(global.config.applicationStartpoint + '?failure=Unauthorized');
    }

	var provider = req.user.provider
	var postUrl
	if (req.cookies['casa-' + provider]) {
		postUrl = '/casa/rest/idp-linking/' + provider
	} else {
		postUrl = global.config.applicationEndpoint
	}

    var subject = req.user.id
    logger.log2('info', 'User authenticated with userid "%s" and strategy "%s"', subject, provider)

    var now = new Date().getTime()
    var jwt = misc.getJWT({
				iss: postUrl,
				sub: subject,
				aud: global.config.clientId,
				jti: uuid(),
				exp: now / 1000 + 30,
				iat: now,
				data: req.user
    		})
    logger.log2('debug', 'Preparing to send user data to: %s with JWT=%s', postUrl, jwt)

    var response_body = `
		<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
			<head>
			</head>
			<body onload="document.forms[0].submit()">
				<noscript>
					<p>
						<strong>Note:</strong> Since your browser does not support JavaScript, you must press the Continue
						button once to proceed.
					</p>
				</noscript>

				<form action="${postUrl}" method="post">
					<div>
						<input type="hidden" name="user" value="${jwt}"/>
						<noscript>
							<input type="submit" value="Continue"/>
						</noscript>
					</div>
				</form>
			</body>
		</html>	`
    res.set('content-type', 'text/html;charset=UTF-8');
    return res.send(response_body);

};

var callbackAuthzResponse = function (req, res) {
	if (!req.user) {
		return res.redirect(global.config.applicationStartpoint + '?failure=Unauthorized');
	}

	var provider = req.user.providerKey
	var idp_initiated_config = global.saml_idp_init_config[provider]
	//TODO: is sp_id part of req? no idea where to grab it from?
	var sp_id = undefined

	if (idp_initiated_config && idp_initiated_config[sp_id]) {

		// TODO: what?
		// TODO: In saml.js we need to call openid.getAuthorizationEndpoint if Saml entiry_id has OpenId setting
		client = idp_initiated_config[sp_id].openidclient
		authorization_params = idp_initiated_config[sp_id].authorization_params

		// Cache authorization_endpoint
		authorization_endpoint = null;
		if (idp_initiated_config[authorization_endpoint]) {
			authorization_endpoint = idp_initiated_config[authorization_endpoint]
		} else {
			authorization_endpoint = openid.getAuthorizationEndpoint()
			idp_initiated_config[authorization_endpoint] = authorization_endpoint
		}

		var subject = req.user.id
		logger.log2('info', 'User authenticated with userid "%s" and strategy "%s"', subject, provider)

		var now = new Date().getTime()
		var jwt = misc.getJWT({
			iss: util.format("https://%s", global.config.serverURI),
			sub: subject,
			aud: authorization_params['client_id'],
			jti: uuid(),
			exp: now / 1000 + 30,
			iat: now,
			data: req.user
		})
		logger.log2('debug', 'Preparing to send authorization request with user data to: %s with JWT=%s', authorization_endpoint, jwt)

		//TODO: I commented the immediate line below, not sure how the impl of getAuthorizationQuery is and why client param is needed
		//authorizationRequest = openid.getAuthorizationQuery(client, jwt)
		//TODO: This is how I understand it could be, it's missing properly url encoding

		authorization_params_cloned = authorization_params
		authorization_params_cloned['session_state'] = JSON.stringify(jwt)
		authorization_url = openid.getAuthorizationUrl(authorization_endpoint, authorization_params_cloned)

		res.set('content-type', 'text/html;charset=UTF-8');
		return res.redirect(authorization_url);
	} else {
		return res.redirect(util.format('%s?failure=Unknown IDP %s or service provider %s', global.config.applicationStartpoint, provider, sp_id))
	}
};

router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Node-Passport'
    });
});

router.get('/login', function (req, res, next) {
    res.redirect(global.config.applicationStartpoint + '?failure=An error occurred');
});

router.get('/casa/:provider/:token',
    validateToken,
    casaCallback)

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

//=================== OIDC ===================
router.get('/auth/openidconnect/callback',
        passportOIDC.authenticate('openidconnect', {
            failureRedirect: '/passport/login'
        }),
        callbackResponse);

    router.get('/auth/openidconnect/:token',
        validateToken,
        passportOIDC.authenticate('openidconnect'))

//===================saml ====================
var entitiesJSON = global.saml_config;
for (key in entitiesJSON) {

    if (entitiesJSON[key].cert && entitiesJSON[key].cert.length > 5 && entitiesJSON[key].enable.match("true")) {
        router.post('/auth/saml/' + key + '/callback',
            passportSAML.authenticate(key, {
                failureRedirect: '/passport/login'
            }),
            callbackResponse);

        router.post('/auth/saml/' + key + '/callback/inbound',
                passportSAML.authenticate(key, {
                    failureRedirect: '/passport/login'
                }),
                callbackAuthzResponse);

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
                logger.log2('error', 'Cert Error: %s', JSON.stringify(err))
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
            if (!tmp[v].logo_img) {
                //Assume the logo resides in default passport image folder
                tmp[v].logo_img = util.format('img/%s.png', v);
            }
        }
        res.status(200).send(JSON.stringify(tmp));
    });


router.get('/auth/meta/idp/:idp',
    function (req, res) {
        var idp = req.params.idp;
        logger.log2('verbose', 'Metadata request for %s', idp);
        fs.readFile(__dirname + '/../idp-metadata/' + idp + '.xml', (e, data) => {
            if (e) {
            	res.status(404).send("Internal Error")
			} else {
				res.status(200).set('Content-Type', 'text/xml').send(String(data))
			}
	    })
    });

//======== catch 404 and forward to login ========
router.all('/*', function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.redirect(global.config.applicationStartpoint + '?failure=The requested resource does not exists!');
});

module.exports = router;
