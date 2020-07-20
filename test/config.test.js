const URL = require('url').URL;
const fs = require('fs');
const nock = require('nock');
const request = require('supertest');
const sinon = require('sinon');
const misc = require('../server/utils/misc');
const data = require('./config-data');
/**
 * Testing config
 */
const passportConfig = data.passportConfig;
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
const pems = data.passportPEM;
fs.writeFileSync(passportRPPEMFile, pems);

/**
 * root level hooks
 */
before((done) => {
	mockIDP();
	// init and get/set all config
	global.app = require('../server/app');

	setTimeout(() => {
		// need again re-initialize, now server started
		global.app = require('../server/app');
		// start the server and ready to request
		request(app)
			.get('/passport/health-check') // Calling Endpoint /passport/health-check
			.expect(200)
			.end((err, res) => {
				if (err) return done(err);

				done();
			});
	}, 500);
});

after((done) => {
	fs.unlinkSync(passportConfigFile);
	fs.unlinkSync(passportRPPEMFile);
	// Todo: need to find why test case not stoping process, press ctrl + c to stop for now
	app.close(done);
});

describe('defaultcfg', function() {
	it('default.js should have passportFile not null or undefined', () => {
		assert.exists(
			defaultcfg.passportFile, 'passportFile is not null or undefined')
	})

	it('default.js should have saltFile not null or undefined', () => {
		assert.exists(
			defaultcfg.saltFile, 'saltFile is not null or undefined')
	})
})

describe('productioncfg', function() {
	it('production.js should have passportFile  not null or undefined', () => {
		assert.exists(
			productioncfg.passportFile, 'passportFile is not null or undefined')
	})
	it('default.js should have saltFile not null or undefined', () => {
		assert.exists(
			productioncfg.saltFile, 'saltFile is not null or undefined')
	})
});

function mockIDP() {
	// mock configuration endpoint and get ticket
	let passportConfigResponseHeader = {
		'www-authenticate': `UMA realm="example", as_uri=${idpURL}, ticket=${ticket}`,
	};
	nock(idpURL)
		.get(idpPassportConfigPath)
		.reply(401, '', passportConfigResponseHeader);

	// mock idp and return token endpoint
	const tokenEndpoint = `${idpURL}/oxauth/restv1/token`;
	const tokenEndpointResponse = {
		token_endpoint: tokenEndpoint
	};
	nock(idpURL)
		.get('/')
		.reply(200, tokenEndpointResponse);

	// mock token endpoint
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
	const passportConfigResponse = data.passportConfigResponse;

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
