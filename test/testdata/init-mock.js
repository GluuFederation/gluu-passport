// Mocks for values used in app.init() flow
const config = require('config')
const nock = require('nock')


/**
 * Mocks for app.init() flow.
 */
class InitMock {
	constructor() {

		this._passportConfig = config.get('passportConfig')
		this._passportConfigURL = new URL(
			this._passportConfig.configurationEndpoint
		)
		this._gluuHostName = this._passportConfigURL.hostname
		this._gluuUrl = this._passportConfigURL.origin // https://<hostname>
		this._configurationEndpointPath = this._passportConfigURL.pathname
		this._ticket = '016f84e8-f9b9-11e0-bd6f-0021cc6004de'
		this._accessToken = '4f31fd1c-852a-4226-b81c-5910aee14246'
			+ '_7673.FFB2.0429.E289.BE8F.91B6.5255.82BF'
		this._pct = 'd0a71780-877f-4edb-b002-592f61d9df72_F978.5DC2.'
			+ '97F8.BA28.3B17.C447.C3FA.153D'
	}

	get gluuUrl() {
		return this._gluuUrl
	}


	// @todo: generate getters if needed


	/**
	 * Mock first UMA request, expected to return 401.
	 * And headers w/ ticket and UMA config endpoint
	 */
	passportConfigEndpoint() {

		/**
		 * Response for oxauth's passport configuration endpoint.
		 * Endpoint comes from passport-config.json
		 * GET /identity/restv1/passport/config
		 * No params sent, no headers. First UMA request.
		 * @type {{ server: string, 'content-length': string,
		 * 'x-xss-protection': string, 'x-content-type-options': string,
		 * 'www-authenticate': string, connection: string,
		 * 'strict-transport-security': string}}
		 */
		let passportConfigUnauthorizedResponseHeader = {
			'server': 'Apache/2.4.29 (Ubuntu)',
			'x-xss-protection': '1; mode=block',
			'x-content-type-options': 'nosniff',
			'strict-transport-security': 'max-age=31536000; includeSubDomains',
			'www-authenticate': 'UMA realm="Authentication Required", '
				+ `host_id=${this._gluuHostName}, `
				+ `as_uri=${this._gluuUrl}/.well-known/uma2-configuration, `
				+ `ticket=${this._ticket}`,
			'content-length': '0',
			'connection': 'close'
		}

		nock(this._gluuUrl, {
			reqheaders: {'host': this._gluuHostName}
		})

			.get(this._configurationEndpointPath, '')
			.reply(
				401, '', passportConfigUnauthorizedResponseHeader
			)


		// Authorized (second UMA request already w/ token and this._pct)
		const passportConfigAuthorizedRequestHeaders = {
			'authorization': `Bearer ${this._accessToken}`,
			'pct': this._pct,
			'host': this._gluuHostName,
			'Connection': 'close'
		}

		/**
		 * Full passport configuration response
		 * You can add more providers as needed
		 * @type Object
		 */
		const passportConfigAuthorizedResponse = {
			conf: {
				serverURI: 'https://chris.gluuthree.org',
				serverWebPort: 8090,
				postProfileEndpoint: 'https://chris.gluuthree.org/oxauth/postlogin.htm',
				spTLSCert: './test/testdata/passport-sp.crt',
				spTLSKey: './test/testdata/passport-sp.key',
				logging: {
					level: 'debug',
					consoleLogOnly: false,
					activeMQConf: {
						enabled: false,
						host: '',
						username: '',
						password: '',
						port: 0
					}
				}
			},
			idpInitiated: {
				openidclient: {
					authorizationEndpoint:
						'https://chris.gluuthree.org/oxauth/restv1/authorize',
					clientId: '1503.f1917f6f-b155-42e0-9bd1-99d56f5c3b50',
					acrValues: 'passport_saml'
				},
				authorizationParams: [{
					provider: 'saml-yidpinitiated',
					extraParams: {},
					redirect_uri:
						'https://chris.gluuthree.org/oxauth/auth/'
						+'passport/sample-redirector.htm',
					response_type: 'code',
					scope: 'openid'
				}]
			},
			providers: [{
				id: 'saml-only-1',
				displayName: 'saml only 1',
				type: 'saml',
				mapping: 'saml_ldap_profile',
				passportStrategyId: 'passport-saml',
				enabled: true,
				callbackUrl:
					'https://chris.gluuthree.org/passport/auth/saml'
					+'/saml-only-1/callback',
				requestForEmail: false,
				emailLinkingSafe: false,
				options: {
					skipRequestCompression: 'True',
					authnRequestBinding: 'HTTP-POST',
					identifierFormat:
						'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
					cert: 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
					entryPoint: 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
					issuer: 'urn:test:one'
				}
			}, {
				id: 'saml-emailreq',
				displayName: 'saml-emailreq',
				type: 'saml',
				mapping: 'saml_ldap_profile',
				passportStrategyId: 'passport-saml',
				enabled: true,
				callbackUrl: 'https://chris.gluuthree.org/passport/auth/saml/saml-emailreq/callback',
				requestForEmail: true,
				emailLinkingSafe: false,
				options: {
					skipRequestCompression: 'True',
					authnRequestBinding: 'HTTP-POST',
					identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
					cert: 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
					entryPoint: 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
					issuer: 'urn:test:threemailreq'
				}
			}, {
				id: 'saml-emaillink',
				displayName: 'saml-emaillink',
				type: 'saml',
				mapping: 'saml_ldap_profile',
				passportStrategyId: 'passport-saml',
				enabled: true,
				callbackUrl: 'https://chris.gluuthree.org/passport/auth/saml/saml-emaillink/callback',
				requestForEmail: false,
				emailLinkingSafe: true,
				options: {
					skipRequestCompression: 'True',
					authnRequestBinding: 'HTTP-POST',
					identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
					cert: 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
					entryPoint: 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
					issuer: 'https://chris.gluuthree.org/'
				}
			}, {
				id: 'saml-yidpinitiated',
				displayName: 'saml-yidpinitiated',
				type: 'saml',
				mapping: 'saml_ldap_profile',
				passportStrategyId: 'passport-saml',
				enabled: true,
				callbackUrl: 'https://chris.gluuthree.org/passport/auth/saml/saml-yidpinitiated/callback',
				requestForEmail: false,
				emailLinkingSafe: false,
				options: {
					skipRequestCompression: 'true',
					authnRequestBinding: 'HTTP-POST',
					validateInResponseTo: 'false',
					identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
					cert: 'MIIDlzCCAn8CFBgf85Th/k9LW/WX1Tm2K8L46XFKMA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJCUjELMAkGA1UECAwCU1AxEjAQBgNVBAcMCVNhbyBQYXVsbzEZMBcGA1UECgwQQ2hyaXMgVGVzdGluZyBuQzEaMBgGA1UEAwwRY2hyaXMuZ2x1dXR3by5vcmcxIDAeBgkqhkiG9w0BCQEWEWNocmlzQHRlc3RpbmcuY29tMB4XDTIwMDYyMzE0NDU1M1oXDTIxMDYyMzE0NDU1M1owgYcxCzAJBgNVBAYTAkJSMQswCQYDVQQIDAJTUDESMBAGA1UEBwwJU2FvIFBhdWxvMRkwFwYDVQQKDBBDaHJpcyBUZXN0aW5nIG5DMRowGAYDVQQDDBFjaHJpcy5nbHV1dHdvLm9yZzEgMB4GCSqGSIb3DQEJARYRY2hyaXNAdGVzdGluZy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIaxbLrWDti7ZLAU4YVxNR6bkjt/HDfczBNF5ULlqttTbP65HgOMAl9eI8Sg+vPN2y7lk7ogQW4bJ3gcBfiBjanU8jrVMntXB8VwhZ8YYThkg1NBb9KPf9sW6FsOz+LDKNxJQeXu7jbKtb7KZvAQiFWCLil6VuKgvmjcDSnRARkSSacqVs7vM/OH9t+zRdeLA2LFEfUIW1GoOi66Tmt6hnVIhIm9I6vJOE+ym0HnyqPUQy6ZEWGbVbJ4Fn9JJmoZ3jJ1v9ZxfKJt2ZCz2HydOWJHXyg2fZwCBVdoJcydtVWQFNVJMEvQUCZNofyiJsCu+rQ033NWyhtrjlYL2fEqRnAgMBAAEwDQYJKoZIhvcNAQELBQADggEBABDbtviA7rVkg/8wPRYPgi07jCoR9x7ZnJjMB4xHFgwIKRF7FKapUBOvqzSmYbNm3JotAdq6o9gPD3rEjQh4Sy2fptA64fquY6Fo5paVTL5AECdumv67+ziB5mtYE0iabY+QHcLHpy6kqJvFpaeUeBNypvx6SaZ3BM/9Q5VwEmmuuf+VAnY/7Q/BHVUhUBeNs9G1LOtqLTr56QyOO4ET1NKihAeE8A/R05O7fELlB2HJ4LxhMLfzwQwQIzAg5fxYrZLtjGu524SSL7Xb6BuLIitwZVAYBcXS2Up37NGHdQu9c2uHFQoxk+ZNKO1ZRUl7IE/8c6DjMTRXRpZqqRaUBco=',
					entryPoint: 'https://chris.gluutwo.org/idp/profile/SAML2/POST/SSO',
					issuer: 'chris.testingenv.org'
				}
			}, {
				id: 'cedev6',
				displayName: 'ce-dev6-passport',
				type: 'openidconnect',
				mapping: 'openidconnect-default',
				passportStrategyId: 'passport-openidconnect',
				enabled: true,
				callbackUrl: 'https://chris.gluuthree.org/passport/auth/cedev6/callback',
				requestForEmail: false,
				emailLinkingSafe: false,
				options: {
					userInfoURL: 'https://gluu.test.ce6.local.org/oxauth/restv1/userinfo',
					clientID: 'b4e0f241-a8c1-4c75-8fc8-4ae7163e9695',
					tokenURL: 'https://gluu.test.ce6.local.org/oxauth/restv1/token',
					authorizationURL: 'https://gluu.test.ce6.local.org/oxauth/restv1/authorize',
					scope: '["openid", "email", "profile"]',
					clientSecret: 'Admin1Admin!',
					issuer: 'https://gluu.test.ce6.local.org'
				}
			}]
		}

		/**
		 * mocking /config endpoint with authorized params
		 */
		nock(this._gluuUrl)
			.persist()
			.get(this._configurationEndpointPath, '',{
				reqheaders: passportConfigAuthorizedRequestHeaders
			})
			.reply(
				200, passportConfigAuthorizedResponse
			)

	}

	/**
	 * UMA configuration endpoint mock
	 * GET /.well-known/uma2-configuration
	 */
	umaConfigurationEndpoint() {

		/**
		 * Uma configuration endpoint path
		 * @type {string}
		 */
		const umaCfgEndpointPath = '/.well-known/uma2-configuration'

		/**
		 * Response body for oxauth's UMA configuration endpoint
		 * GET /.well-known/uma2-configuration
		 * @type {
		 * {response_types_supported: [string, string, string],
		 * introspection_endpoint: string, scope_endpoint: string,
		 * grant_types_supported: [string, string, string, string],
		 * ui_locales_supported: string[], claims_interaction_endpoint: string,
		 * issuer: string, authorization_endpoint: string,
		 * service_documentation: string,
		 * token_endpoint_auth_signing_alg_values_supported: string[],
		 * op_tos_uri: string, permission_endpoint: string,
		 * code_challenge_methods_supported: null, jwks_uri: string,
		 * op_policy_uri: string, registration_endpoint: string,
		 * token_endpoint_auth_methods_supported: string[],
		 * uma_profiles_supported: [], resource_registration_endpoint: string,
		 * token_endpoint: string}}
		 */
		const umaCfgEndpointResponse = {
			'issuer' : `${this._gluuUrl}`,
			'authorization_endpoint' :
				`${this._gluuUrl}/oxauth/restv1/authorize`,
			'token_endpoint' : `${this._gluuUrl}/oxauth/restv1/token`,
			'jwks_uri' : `${this._gluuUrl}/oxauth/restv1/jwks`,
			'registration_endpoint' : `${this._gluuUrl}/oxauth/restv1/register`,
			'response_types_supported' : [ 'code', 'id_token', 'token' ],
			'grant_types_supported' : [
				'authorization_code', 'implicit', 'client_credentials',
				'urn:ietf:params:oauth:grant-type:uma-ticket' ]
			,
			'token_endpoint_auth_methods_supported' : [
				'client_secret_basic', 'client_secret_post',
				'client_secret_jwt', 'private_key_jwt', 'tls_client_auth',
				'self_signed_tls_client_auth'
			],
			'token_endpoint_auth_signing_alg_values_supported' : [
				'HS256', 'HS384', 'HS512', 'RS256', 'RS384',
				'RS512', 'ES256', 'ES384', 'ES512'
			],
			'service_documentation' : 'http://gluu.org/docs',
			'ui_locales_supported' : [
				'en', 'bg', 'de', 'es', 'fr', 'it', 'ru', 'tr'
			],
			'op_policy_uri' :
				'http://ox.gluu.org/doku.php?id=oxauth:policy',
			'op_tos_uri' :
				'http://ox.gluu.org/doku.php?id=oxauth:tos',
			'introspection_endpoint' :
				`${this._gluuUrl}/oxauth/restv1/rpt/status`,
			'code_challenge_methods_supported' : null,
			'claims_interaction_endpoint' :
				`${this._gluuUrl}/oxauth/restv1/uma/gather_claims`,
			'uma_profiles_supported' : [ ],
			'permission_endpoint' :
				`${this._gluuUrl}/oxauth/restv1/host/rsrc_pr`,
			'resource_registration_endpoint' :
				`${this._gluuUrl}/oxauth/restv1/host/rsrc/resource_set`,
			'scope_endpoint' : `${this._gluuUrl}/oxauth/restv1/uma/scopes`
		}

		/**
		 * Mocking uma-configuration endpoint response
		 */
		nock(this._gluuUrl)
			.persist()
			.get(umaCfgEndpointPath)
			.reply(200, umaCfgEndpointResponse)

	}

	/**
	 * Mocking UMA token endpoint
	 */
	umaTokenEndpoint() {

		// request
		const umaTokenRequestHeader = {
			'host': this._gluuHostName,
			'content-type' : 'application/x-www-form-urlencoded',
			'accept' : 'application/json',
			'content-length': 1043
			//'Connection': 'close'
		}

		const umaTokenRequestBody = {
			'grant_type': 'urn:ietf:params:oauth:grant-type:uma-ticket',
			'client_assertion_type':
				'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			'client_assertion':
				'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6ImNlZjdlZDRk'
				+ 'LTAwODgtNDMxMC04NzhmLTM2ZjlkOGMyMGNmN19zaWdfcnM1MTIifQ.'
				+ 'eyJpc3MiOiIxNTAyLmI4NTdiNDE1LTdjMjMtNGQ5OC1iYjE4LWI4ZDE'
				+ '5ZTcwYmU3NCIsInN1YiI6IjE1MDIuYjg1N2I0MTUtN2MyMy00ZDk4LW'
				+ 'JiMTgtYjhkMTllNzBiZTc0IiwiYXVkIjoiaHR0cHM6Ly90MS50ZWNob'
				+ 'm8yNHg3LmNvbS9veGF1dGgvcmVzdHYxL3Rva2VuIiwianRpIjoiZDRi'
				+ 'ODExMjktY2EwNC00NTcwLThhYmUtNzg4ODA4MTVmMzlmIiwiZXhwIjo'
				+ 'xNTk4OTk3MDgzLjAzMSwiaWF0IjoxNTk4OTk3MDUzMDMxfQ.ROOLuuS'
				+ '9wIKLM_iDNzWCCtdOYg6HvIL7s2zxT1mSpBmKWJbBREh2hIyJuIVCFp'
				+ 'drJPbPuo9uO_eyukWPMoF9BWNGo2WOXMvd_FUpDi3kqwHVDBxIXKwQ-'
				+ 'O87JqIzcxE5ZqOAKAXVuGBefGqzDuAS0DgzeFFOp6E7bGaKfBOgpYCHSb'
				+ 'dPuF_7wU1ydTj0ZYIWKtfjQ5UoBRh0TC0rEssWb3qEF00qk86HZjqLDhb'
				+ 'JWhgkK5mj2akDuAUrhH3ixoYaFohLzFe86-WXJRbzwBaHpAI-eSr4lo3Wj'
				+ '3Trqv2tG02VC_SUZVTILc0By5pbkHYs5Vh4wH1Awq1yrIE8WlJoA',
			'client_id': '1502.b857b415-7c23-4d98-bb18-b8d19e70be74',
			'ticket': this._ticket
		}


		// response
		const umaTokenResponseHeader = {
			'x-content-type-options': 'nosniff',
			'strict-transport-security': 'max-age=31536000; includeSubDomains',
			'content-type': 'application/json',
			'connection': 'close'
		}


		const umaTokenResponseBody = {
			'access_token': this._accessToken,
			'token_type': 'Bearer',
			'pct': this._pct,
			'upgraded': false,
		}

		// mocking endpoint response if conditions match
		nock(this._gluuUrl,{
			//reqheaders: umaTokenRequestHeader
		})
			.persist()
			.post('/oxauth/restv1/token', umaTokenRequestBody)
			.reply(200, umaTokenResponseBody, umaTokenResponseHeader)
	}

}

module.exports = InitMock







