const R = require('ramda')
const URL = require('url').URL;
const fs = require('fs');
const nock = require('nock');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const sinon = require('sinon');
const misc = require('../server/utils/misc');

/**
 * Testing config
 */
const passportConfig = {
	"configurationEndpoint": "https://gluu.test.local.org/identity/restv1/passport/config",
	"failureRedirectUrl": "https://gluu.test.local.org/oxauth/auth/passport/passportlogin.htm",
	"logLevel": "info",
	"consoleLogOnly": false,
	"clientId": "1502.3fe76d0a-38dd-4f91-830b-e33fd70d778a",
	"keyPath": "/tmp/passport-rp.pem",
	"keyId": "fbc267ef-0705-4b3a-8c80-bf70e75cf08b_sig_rs512",
	"keyAlg": "RS512"
};
const defaultcfg = require('../config/default.json');
const productioncfg = require('../config/production.json');
const passportConfigFile = '/tmp/passport_config.json';
const passportRPPEMFile = passportConfig.keyPath;
const passportConfigURL = new URL(passportConfig.configurationEndpoint);
const idpURL = passportConfigURL.origin;
const idpPassportConfigPath = passportConfigURL.pathname;
const ticket = '016f84e8-f9b9-11e0-bd6f-0021cc6004de';

// generate new passport config file
fs.writeFileSync(passportConfigFile, JSON.stringify(passportConfig));
process.env.passport_config_file = passportConfigFile;
process.env.config_update_timer = 600000;

// passport certs
const pems = `-----BEGIN RSA PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKLes42c4Twd5K
OykgvZvBLOcJ6124YX97EIp/I9GMUMNPKxOpK3cxCCt7RBe82K1+rbiW6ZO+UwlA
f3/SrCilHDsryr0y35pBj1FyXDcQ7TKMD79urxJ6dV2vIOJgneFzXW1LDQrGWxuz
QVryfGgcLoH7VJEO9AbWx/xPrccUCUqNqHzEnfmC9ej/KljIsNvg1JQIrXsxFztG
h2tPpMhFNMhuXlQDXWzLD2RQBr4+jOkqtRAEgbemri+4bq1s2NJYj7qkD0XNtFlH
PT093SmI0rWZ5xzsJPuLeqDPMFau6wj0Ow864uKzMGRZLYkSJWXjBVBTJ8luh+qt
iGgNYhpnAgMBAAECggEAWyM46f8wyLI3SKIDh6lBOWLK4StSq4dzxl9t9yMH1mcf
q6Pg8HzR9W3X3/CRfMT17GlWEN1JBt36iTMQRUDq74ba24JAKFsod44p6lHMVtp9
0ypUIopT25TlfsjlkyUIWI9Qcaj25vRx96up2i4fZjjGyitUWnfBT3eF8ssEtzAs
kSY5aAikVTsHn+a2ZwixIT3PSD1J7jUwkfYg+vZPiIhf5siyzo0t+vtqHg3k75y3
UmbdrW1DCGFezTKAReL5t/y+OTL2vaN+dZIaWP8ZUCaC8i2mC/YklaILoEULEom9
hGMgzDbsNaRdoTTGuZBn+uTAlO7TPXj8E9xadjODsQKBgQD/GwKiY6sK8+E+TYFS
rnyPVnR+gTyQ3A3iOQkN6cbGb1McfkH2+0dSqz1/uAkk1y6vxsSMMZgerl30spH5
iA68jwuPAFXLDZxTJsfslACbOxn2F/+/0NBTOyjzPxr1DLZp0hWSmspzg9b7BBXk
jOOGVroHK/J27fI0jio/8u4fNwKBgQDK42aNHFbuxJqxVRRkD18iqBBUxPKzfiGr
YdQlGy1JpupYqmVohjDdeAbYyqYgKANuomljmUdlu+yr17GzVNhMx1U6TDbr6XlM
JczMVQORzEc5n8S+PvCZ4QXW+ylScCABhkU+hFMzL0Hznq9NXDQWCLK0Q/y2qOCa
N3iwBECWUQKBgQDZLzKv8/Cjs3u5Ih0OulR7Z9xn8zkQDviW933Y5YWAXTjB0k/w
qH9RR05lVNYcEkLCDZQ50uMyg7qj3/9dFNOO/q2VgnCIHb9QH30n0d0uS0PP+yCW
On2RzpUPelNF+xu1vdD17mibrcuyCwlkefoe3ekkv+p+DBgfXEVmCjlmQwKBgEiD
/qNw/aFZo/C9+AvLcrVwXGXv/s8oxd/7l1er3wP0JM6MGLLDQ7Pkso3J4JadtpxU
cFao8lvqTy0cauct7CGFHXE4zGiFilUtLYXa3Ou/l7WA5VEaLeTSCMROAPb2HHpv
A1DU+ufQfEIW9ZEw42z8ruK/ahPfSGfWa8x9uJgBAoGBAIOk47iR0WyANOAbBnpO
y+L/CV3KgfjSjnLNax/zxrhhK7h2qwAuR6DcJezg1ugE21Os2CAmH5qgg4xbZuNP
2MWd83wdhB9pncsmTV+yZhr+Kn3RqVufiqm4LfL5dV0YUcUdr0BVLiw8IkRuH15B
yn1QSd+71PbT+sSXOjGIaF/3
-----END RSA PRIVATE KEY-----`;
fs.writeFileSync(passportRPPEMFile, pems);

/**
 * root level hooks
 */
before((done) => {
	mockIDP();
	done();
});

after((done) => {
	fs.unlinkSync(passportConfigFile);
	fs.unlinkSync(passportRPPEMFile);
	done();
});

describe('defaultcfg', function () {
	it('default.json should have passportFile not null or undefined', () => {
		assert.exists(defaultcfg.passportFile, 'passportFile is not null or undefined')
	});

	it('default.json should have saltFile not null or undefined', () => {
		assert.exists(defaultcfg.saltFile, 'saltFile is not null or undefined')
	})
});

describe('productioncfg', function () {
	it('production.json should have passportFile  not null or undefined', () => {
		assert.exists(productioncfg.passportFile, 'passportFile is not null or undefined')
	});
	it('default.json should have saltFile not null or undefined', () => {
		assert.exists(productioncfg.saltFile, 'saltFile is not null or undefined')
	})
});

/**
 * Todo: Testing purpose temporarily added app test here
 */
let app = null;
describe('App', () => {

	after((done) => {
		app.close(done);
		done();
	});

	it('Health Check', (done) => {
		expect('test').to.equal('test');
		app = require('../server/app');
		// Todo need to fix server start issue
		request(app)
			.get('/')
			.expect(200)
			.end((err, res) => {
				if (err) throw done(err);

				done();
			});
	});

});

function mockIDP() {
	// mock configuration endpoint and get ticket
	console.log('mock configuration endpoint and get ticket');
	let passportConfigResponseHeader = {
		'www-authenticate': `UMA realm="example", as_uri=${idpURL}, ticket=${ticket}`,
	};
	nock(idpURL)
		.get(idpPassportConfigPath)
		.reply(401, '', passportConfigResponseHeader);

	// mock idp and return token endpoint
	console.log('mock idp and return token endpoint ')
	const tokenEndpoint = `${idpURL}/oxauth/restv1/token`;
	const tokenEndpointResponse = {
		token_endpoint: tokenEndpoint
	};
	nock(idpURL)
		.get('/')
		.reply(200, tokenEndpointResponse);

	// mock token endpoint
	console.log('mock token endpoint')
	const clientId = passportConfig.clientId;
	const now = new Date().getTime();
	const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6ImZiYzI2N2VmLTA3MDUtNGIzYS04YzgwLWJmNzBlNzVjZjA4Yl9zaWdfcnM1MTIifQ.eyJpc3MiOiIxNTAyLjNmZTc2ZDBhLTM4ZGQtNGY5MS04MzBiLWUzM2ZkNzBkNzc4YSIsInN1YiI6IjE1MDIuM2ZlNzZkMGEtMzhkZC00ZjkxLTgzMGItZTMzZmQ3MGQ3NzhhIiwiYXVkIjoiaHR0cHM6Ly9nbHV1LnRlc3QubG9jYWwub3JnL294YXV0aC9yZXN0djEvdG9rZW4iLCJqdGkiOiIwZGQzNGI3My0zMTA2LTRhZmUtYmFiMS02YTlmYWQ0MGViN2UiLCJleHAiOjE1OTQyMDg5NDAuODUzLCJpYXQiOjE1OTQyMDg5MTA4NTN9.VA--wKcNoq8bNzaTW1QxaexPWwDfQkHg3ti-EbYnrwaMuayEecH_uZlhxC-1TZJfKDhAzaylevoOnS_ihgMXJ_fFAgfEnqPO2TgcjI8MEnyvbiTnJNtWAz7iptbrs4gurO_9wjJLe9Z0b8XmngqwVz0rkNGnmSA49ryAcA4ndF3z_zx5MY2kvu4MQhP7ofJt3f0AST4XipUMYVyB8Ohfe_oXnTs1WVbbZCw_1Rl-f9nBTprGoQMCrmgnbPFKvD-rs-8XVm3vt2dQNsBvfcUOl8Zmz_Mfmu5JMO2uQfXRDkW96W3OXjU7rzsd2sZbU1rUcZy_-dqQ7R-pqIcJoUIZ2A';

	// mock misc.getRpJWT
	sinon
	.mock(misc)
	.expects('getRpJWT')
	.returns(token);

	const rptTokenRequest = {
		grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
		client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
		client_assertion: token,
		client_id: clientId,
		ticket
	}

	const rptTokenResponse = {
		access_token: 'sbjsbhsSSJHBSUSSJHVhjsgvhsgvshgsv',
		token_type: 'Bearer',
		pct: 'c2F2ZWRjb25zZW50'
	}

	nock(idpURL)
		.post(`/oxauth/restv1/token`, rptTokenRequest)
		.reply(200, rptTokenResponse)

	// mock configuration endpoint and get response
	console.log('mock configuration endpoint and get response');
	
	const passportConfigResponse = {
		"conf": {
			"serverURI": "https://gluu.test.local.org",
			"serverWebPort": 8090,
			"postProfileEndpoint": "https://gluu.test.local.org/oxauth/postlogin.htm",
			"spTLSCert": "/etc/certs/passport-sp.crt",
			"spTLSKey": "/etc/certs/passport-sp.key",
			"logging": {
				"level": "info",
				"consoleLogOnly": false,
				"activeMQConf": {
					"enabled": false,
					"host": "",
					"username": "",
					"password": "",
					"port": 0
				}
			}
		},
		"idpInitiated": {
			"openidclient": {
				"authorizationEndpoint": "https://gluu.test.local.org/oxauth/restv1/authorize",
				"clientId": "1503.6a319ccf-c801-4fd8-a11a-a9e0c8e92322",
				"acrValues": "passport_saml"
			},
			"authorizationParams": []
		},
		"providers": [{
			"id": "cedev6",
			"displayName": "ce-dev6-passport",
			"type": "openidconnect",
			"mapping": "openidconnect-default",
			"passportStrategyId": "passport-openidconnect",
			"enabled": true,
			"callbackUrl": "https://gluu.test.local.org/passport/auth/cedev6/callback",
			"requestForEmail": false,
			"emailLinkingSafe": false,
			"options": {
				"userInfoURL": "https://gluu.test.ce6.local.org/oxauth/restv1/userinfo",
				"clientID": "b4e0f241-a8c1-4c75-8fc8-4ae7163e9695",
				"tokenURL": "https://gluu.test.ce6.local.org/oxauth/restv1/token",
				"authorizationURL": "https://gluu.test.ce6.local.org/oxauth/restv1/authorize",
				"scope": "[\"openid\", \"email\", \"profile\"]",
				"clientSecret": "Admin1Admin!",
				"issuer": "https://gluu.test.ce6.local.org"
			}
		}]
	};

	const reqheaders = {
		authorization: `Bearer ${rptTokenResponse.access_token}`,
		pct: rptTokenResponse.pct
	};
	nock(idpURL, {
		reqheaders
	})
		.get(idpPassportConfigPath)
		.reply(200, passportConfigResponse);
}