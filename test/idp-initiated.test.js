const chai = require('chai')
const rewire = require('rewire')
const nock = require('nock')
const idp_initiated = rewire('../server/idp-initiated.js')
const assert = chai.assert
const config = require('config')
const helper = require('./helper.js')
const base64url = require('base64url')
const jwt = require('jsonwebtoken')

/* This is how passportFile looks like
{1
	"configurationEndpoint":
	"https://chris.gluuthree.org/identity/restv1/passport/config",

	"failureRedirectUrl":
	"https://chris.gluuthree.org/oxauth/auth/passport/passportlogin.htm",

	"logLevel": "debug",

	"consoleLogOnly": false,

	"clientId": "1502.d49baf9f-b19b-40de-a990-33d08e7f9e77",

	"keyPath": "/etc/certs/passport-rp.pem",

	"keyId": "36658e03-34ea-4745-ad43-959916c96def_sig_rs512",

	"keyAlg": "RS512"
}
*/


const basicConfig = config.get('passportFile')

const mocked_conf = config.get('passportConfigAuthorizedResponse')['conf']

describe('idp-initiated.createAuthzRequest', () => {

	const valid_provider = 'saml-yidpinitiated'

	const valid_user = {
		cn : 'tester3',
		displayName : 'tester3',
		givenName : 'Testerfirst',
		mail : 'tester3@test.com',
		sn : 'Testerlast2',
		uid :'tester3'
	}

	const valid_extraParams = {}

	const valid_iiconfig = {
		authorizationParams: [{
			provider : 'saml-yidpinitiated',
			redirect_uri:'https://chris.gluuthree.org'+
			'/oxauth/auth/passport/sample-redirector.htm',
			response_type:'code',
			scope:'openid',
			extraParams: valid_extraParams
		}],
		openidclient: {
			acrValues:'passport_saml',
			authorizationEndpoint: 'https://chris.gluuthree.org/'+
			'oxauth/restv1/authorize',
			clientId:'1503.f1917f6f-b155-42e0-9bd1-99d56f5c3b50'
		}

	}


	// "importing" not exported function
	var createAuthzRequest = idp_initiated.__get__('createAuthzRequest')

	/**
	 * @todo: Activate this (uses `rewire`) to do unit instead of integration
	 * Mocks basic configuration, jwt...
	 * disableNetConnect so app don't try to get it from "external" sources.
	 */
	beforeEach(() => {
		// idp_initiated.__set__('config', mocked_conf)
		// idp_initiated.__set__('basicConfig', basicConfig)
		// idp_initiated.__set__('jwt', jwt)
		// nock.disableNetConnect()
		// idp_initiated.__set__('logger', logger)
	})

	afterEach(() => {
		// nock.enableNetConnect()
	})
	it('createAuthzRequest should exist', () => {
		assert.exists(
			createAuthzRequest,
			'createAuthzRequest is null nor undefined')
	})

	it('createAuthzRequest should be a function', () => {
		assert.isFunction(
			createAuthzRequest,
			'createAuthzRequest is not a function'
		)
	})


	it('workaround: req.state should not have dots', () => {

		assert.notInclude(
			createAuthzRequest(
				valid_user, valid_iiconfig, valid_provider
			).state, '.')
	})

	it('workaround: decoded req.state should have all jwt keys', () => {


		let b64url_state = createAuthzRequest(
			valid_user,valid_iiconfig,valid_provider).state

		let jwt_string = base64url.decode(b64url_state)

		let decoded_jwt = jwt.decode(jwt_string)

		assert.hasAllKeys(
			decoded_jwt,
			['iss','sub','aud','jti','exp','iat','data'],
			'decoded req.state has all keys:'+
			'iss, sub, aud, jti , exp, iat, data'
		)

	})

	it('workaround: req.state should not have underscores', () => {
		assert.notInclude(
			createAuthzRequest(
				valid_user, valid_iiconfig, valid_provider
			).state, '_')

	})

})
