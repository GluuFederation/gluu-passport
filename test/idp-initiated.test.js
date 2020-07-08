const chai = require('chai')
const rewire = require('rewire')
const nock = require('nock')
const idp_initiated = rewire('../server/idp-initiated.js')
const sinon = require('sinon')
const assert = chai.assert
const config = require('config')
const passportFile = config.get('passportFile')
const sha1 = require('sha1')




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
const basicConfig = {
	'configurationEndpoint':
	'https://chris.gluuthree.org/identity/restv1/passport/config',
	'failureRedirectUrl':
	'https://chris.gluuthree.org/oxauth/auth/passport/passportlogin.htm',
	'logLevel': 'debug',
	'consoleLogOnly': false,
	'clientId': '1502.d49baf9f-b19b-40de-a990-33d08e7f9e77',
	'keyPath': '/etc/certs/passport-rp.pem',
	'keyId': '36658e03-34ea-4745-ad43-959916c96def_sig_rs512',
	'keyAlg': 'RS512'
}

const conf = {
	'serverURI' : 'https://chris.gluuthree.org',
	'serverWebPort' : 8090,
	'postProfileEndpoint' : 'https://chris.gluuthree.org/oxauth/postlogin.htm',
	'spTLSCert' : '/etc/certs/passport-sp.crt',
	'spTLSKey' : '/etc/certs/passport-sp.key',
	'logging' : {
		'level' : 'debug',
		'consoleLogOnly' : false,
		'activeMQConf' : {
			'enabled' : false,
			'host' : '',
			'username' : '',
			'password' : '',
			'port' : 0
		}
	}
}
const scope = nock('https://chris.gluuthree.org')
	.get('/identity/restv1/passport/config')
	.reply( 200, {
		'conf' : conf,
		'idpInitiated' : {
			'openidclient' : {
				'authorizationEndpoint' : 'https://chris.gluuthree.org/oxauth/restv1/authorize',
				'clientId' : '1503.f1917f6f-b155-42e0-9bd1-99d56f5c3b50',
				'acrValues' : 'passport_saml'
			},
			'authorizationParams' : [ {
				'provider' : 'saml-yidpinitiated',
				'extraParams' : { },
				'redirect_uri' : 'https://chris.gluuthree.org/oxauth/auth/passport/sample-redirector.htm',
				'response_type' : 'code',
				'scope' : 'openid'
			} ]
		},
		'providers' : [ {
			'id' : 'saml-only-1',
			'displayName' : 'saml only 1',
			'type' : 'saml',
			'mapping' : 'saml_ldap_profile',
			'passportStrategyId' : 'passport-saml',
			'enabled' : true,
			'callbackUrl' : 'https://chris.gluuthree.org/passport/auth/saml/saml-only-1/callback',
			'requestForEmail' : false,
			'emailLinkingSafe' : false,
			'options' : {
				'skipRequestCompression' : 'True',
				'authnRequestBinding' : 'HTTP-POST',
				'identifierFormat' : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
				'cert' : 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
				'entryPoint' : 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
				'issuer' : 'urn:test:one'
			}
		}, {
			'id' : 'saml-emailreq',
			'displayName' : 'saml-emailreq',
			'type' : 'saml',
			'mapping' : 'saml_ldap_profile',
			'passportStrategyId' : 'passport-saml',
			'enabled' : true,
			'callbackUrl' : 'https://chris.gluuthree.org/passport/auth/saml/saml-emailreq/callback',
			'requestForEmail' : true,
			'emailLinkingSafe' : false,
			'options' : {
				'skipRequestCompression' : 'True',
				'authnRequestBinding' : 'HTTP-POST',
				'identifierFormat' : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
				'cert' : 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
				'entryPoint' : 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
				'issuer' : 'urn:test:threemailreq'
			}
		}, {
			'id' : 'saml-emaillink',
			'displayName' : 'saml-emaillink',
			'type' : 'saml',
			'mapping' : 'saml_ldap_profile',
			'passportStrategyId' : 'passport-saml',
			'enabled' : true,
			'callbackUrl' : 'https://chris.gluuthree.org/passport/auth/saml/saml-emaillink/callback',
			'requestForEmail' : false,
			'emailLinkingSafe' : true,
			'options' : {
				'skipRequestCompression' : 'True',
				'authnRequestBinding' : 'HTTP-POST',
				'identifierFormat' : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
				'cert' : 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
				'entryPoint' : 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
				'issuer' : 'https://chris.gluuthree.org/'
			}
		}, {
			'id' : 'saml-yidpinitiated',
			'displayName' : 'saml-yidpinitiated',
			'type' : 'saml',
			'mapping' : 'saml_ldap_profile',
			'passportStrategyId' : 'passport-saml',
			'enabled' : true,
			'callbackUrl' : 'https://chris.gluuthree.org/passport/auth/saml/saml-yidpinitiated/callback',
			'requestForEmail' : false,
			'emailLinkingSafe' : false,
			'options' : {
				'skipRequestCompression' : 'true',
				'authnRequestBinding' : 'HTTP-POST',
				'validateInResponseTo' : 'false',
				'identifierFormat' : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
				'cert' : 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
				'entryPoint' : 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
				'issuer' : 'chris.testingenv.org'
			}
		} ]
	})



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
			redirect_uri:'https://chris.gluuthree.org/oxauth/auth/passport/sample-redirector.htm',
			response_type:'code',
			scope:'openid',
			extraParams: valid_extraParams
		}],
		openidclient: {
			acrValues:'passport_saml',
			authorizationEndpoint:'https://chris.gluuthree.org/oxauth/restv1/authorize',
			clientId:'1503.f1917f6f-b155-42e0-9bd1-99d56f5c3b50'
		}

	}



	// with dots
	const jwt_example = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjM2NjU4ZTAzLTM0ZWEtNDc0NS1hZDQzLTk1OTkxNmM5NmRlZl9zaWdfcnM1MTIifQ.eyJpc3MiOiJodHRwczovL2NocmlzLmdsdXV0aHJlZS5vcmciLCJzdWIiOlsidGVzdGVyNCJdLCJhdWQiOiIxNTAzLmYxOTE3ZjZmLWIxNTUtNDJlMC05YmQxLTk5ZDU2ZjVjM2I1MCIsImp0aSI6IjBmZGU5OGRjLWM3MWYtNDQ3ZS1iYWJlLTAwMWRlZDY1OTgyZSIsImV4cCI6MTU5NDE0NzkxMS4wOTgsImlhdCI6MTU5NDE0Nzg4MTA5OCwiZGF0YSI6IkJlRzBtQVNpVlM4SmRVdDJUYlQzWVFJaTlvc01xV0xtVlYvbDAvRkk3RFVobTB6OG9JRUhHS0FqYjZzT2VlQUJLMlBCMlBlYWdBU0VWREFSQysyc0ZhLzlFaStSY2N0ZWd4WmFIRGJaUXRLVEU4MGU1OHVST3hjZEQzSkhRV2lpZ3haYUhEYlpRdExqaFBPaHV1dmlXbWg0M1JOemF2cnY0RGh1dWc2bi9PbTdzeGZxaThlblpYYkpWdnNLblJaTVU2V05HT2FWRXpLOHowY3ZTY1VIMi9oUjh3L0dSSGhyIn0.m1CIbFfV1JNiFgb8hARoBAocc-a-Gsm6tn9xyGTX6ZGNPs1lu-Zdek_uKbb8t-BkYAInyAF355L4DR9Y77y8KfS22AeLjUqPvAOxyT5dziBhUAdacgSETiOrzRF6zuYsNJCI9Uok4v0kISLetXku9ZqiI1R57y1F1a4bOstB90EC_7I3xqrDSM0-BIUQlPZh66KcJY6Lw3Zyh-r41gP0VXghrO4DSWRMrWXmQuXIH_lQq-iaE-OnJMdW-ZeYEyFHSDdLl4VAV2YYUtokOZSIGI8Jg5xlet-re-CCZ7K9Ajedlq_OhgNTa1UfDbK2pHKePpH9qvzQjgOyTUhi699CTA'


	// "importing" not exported function
	var createAuthzRequest = idp_initiated.__get__('createAuthzRequest')

	beforeEach(() => {
		idp_initiated.__set__('config', conf)
		idp_initiated.__set__('basicConfig', basicConfig)
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