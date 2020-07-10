const logger = require('../server/utils/logging'),
	nock = require('nock')


function configureLogger() {
	
	logger.configure({
		level: 'debug',

	})
}

function getMockedConfiguration() {
	let mocked_configuration = {
		'conf' : {
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
		},
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
	}
	return mocked_configuration
}

function nockMockedConfigurationRequest() {
	const scope =  nock('https://chris.gluuthree.org')
		.get('/identity/restv1/passport/config')
		.reply( 200, getMockedConfiguration)
	return scope
}

function init(){ 
	configureLogger()
	logger.log2('debug','test helper init called')
}

module.exports = {
	getMockedConfiguration : getMockedConfiguration,
	nockMockedConfigurationRequest : nockMockedConfigurationRequest
}

init()