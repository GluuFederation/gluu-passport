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
const defaultcfg = require('../config/default.js');
const productioncfg = require('../config/production.js');
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

	const serverStart = setInterval(() => {
		// need again re-initialize, now server started
		global.app = require('../server/app');

		if(!app.address) {
			return
		}
		// start the server and ready to request
		request(app)
			.get('/passport/health-check') // Calling Endpoint /passport/health-check
			.expect(200)
			.end((err, res) => {
				if (err) return done(err);

				clearInterval(serverStart);
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
	const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjM2NjU4ZTAzLTM0ZWEt'+
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
	'6m6fZuEMAS6k9izCuq99-sPLrRBXshAjbpdoNzIBg60TOMgxyI8gsI9b38HA';

	// mock misc.getRpJWT
	sinon
		.mock(misc)
		.expects('getRpJWT')
		.atLeast(3)
		.atMost(5)
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
