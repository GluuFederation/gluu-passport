const chai = require('chai')
const rewire = require('rewire')
const nock = require('nock')
const idp_initiated = rewire('../server/idp-initiated.js')
// const sinon = require('sinon')
const assert = chai.assert
const config = require('config')
// const passportFile = config.get('passportFile')
const helper = require('./helper.js')

/* This is how passportFile looks like
{
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

// consts to mock

const jwt = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjM2NjU4ZTAzLTM0ZWEt'+
'NDc0NS1hZDQzLTk1OTkxNmM5NmRlZl9zaWdfcnM1MTIifQ.eyJpc3MiOiJodHRwczovL2NocmlzL'+
'mdsdXV0aHJlZS5vcmciLCJzdWIiOlsidGVzdGVyMyJdLCJhdWQiOiIxNTAzLmYxOTE3ZjZmLWIxN'+
'TUtNDJlMC05YmQxLTk5ZDU2ZjVjM2I1MCIsImp0aSI6IjMxYTFmNGUwLTE5YzUtNDMwMi1hYzE4L'+
'WY1OTk2YjcxYzVlNyIsImV4cCI6MTU5NDE4MDc2NC45OSwiaWF0IjoxNTk0MTgwNzM0OTkwLCJkY'+
'XRhIjoiQmVHMG1BU2lWUys2K3RUSDhUWFZNZ0lpOW9zTXFXTG1WVi9sMC9GSTdEWDBBQzRXQ3hlK'+
'1hhQWpiNnNPZWVBQksyUEIyUGVhZ0FSM3lQcExBSE52YjYvOUVpK1JjY3RlZ3haYUhEYlpRdEsyd'+
'GFzN3JPZlFFUmNkRDNKSFFXaWlneFphSERiWlF0Snpycml6WXV0TXNyUG9vVklpMG9ZajlTYWM3S'+
'k16a0NqWVNQM2dSU3phMXJaQUt5Mmw4VEVRejRxYVQxWjFzSHQ3TEpzem9OZTcvcmNLZ0pVM0wwb'+
'W1qbCtYNDkwRmJEVT0ifQ.G7O9uIP00vtsSsmjs8IPf9Tl-6Q9YE-gh-t5_-K2HKoO7akSLUJegv'+
'u4qYjaC9Din1fkRKJZpndGUiiJfcpACum4llw1GIC_UqPkDZhO2i5azwqy_nBRLHOxdyd_DchP2O'+
'jVYUMMwzZIzh2nUNQYk7NOqMKV05nd-YausfG6cFECqEhu_J0glUsm41cs066shv9UfU2fwNyPXS'+
'lOSVupYW6Ey6KjP03t5E44m0Ab09N0pHqIJlFBxYi4xb64RXzDhfjfV2SsWZl8XHAuY5mdrdCFxT'+
'6m6fZuEMAS6k9izCuq99-sPLrRBXshAjbpdoNzIBg60TOMgxyI8gsI9b38HA'

const basicConfig = config.get('passportFile')

const mocked_conf = helper.getMockedConfiguration()['conf']

// const scope = helper.nockMockedConfigurationRequest()




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

	beforeEach(() => {
		idp_initiated.__set__('config', mocked_conf)
		idp_initiated.__set__('basicConfig', basicConfig)
		idp_initiated.__set__('jwt', jwt)
		nock.disableNetConnect()
		// idp_initiated.__set__('logger', logger)
	})

	afterEach(() => {
		nock.enableNetConnect()
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

	it('workaround: req.state should have underscores', () => {
		assert.include(
			createAuthzRequest(
				valid_user, valid_iiconfig, valid_provider
			).state, '_')

	})

})