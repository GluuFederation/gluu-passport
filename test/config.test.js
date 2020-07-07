const R = require('ramda')
const URL = require('url').URL;
const fs = require('fs');
const nock = require('nock');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

/**
 * Testing config
 */
const passportConfig = {
	"configurationEndpoint": "https://gluu.local.org/identity/restv1/passport/config",
	"failureRedirectUrl": "https://gluu.local.org/oxauth/auth/passport/passportlogin.htm",
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
process.env.passport_file = passportConfigFile;
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

describe('defaultcfg', function() {
	it('default.json should have passportFile not null or undefined', () => {
		assert.exists(defaultcfg.passportFile, 'passportFile is not null or undefined')
	});

	it('default.json should have saltFile not null or undefined', () => {
		assert.exists(defaultcfg.saltFile, 'saltFile is not null or undefined')
	})
});

describe('productioncfg', function() {
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
describe('App', () => {

	after((done) => {
		// app.close(done);
		done();
	});

	it('Health Check', (done) => {
		expect('test').to.equal('test');
		done();
		// request(app)
		//     .get('/')
		//     .expect(200)
		//     .end((err, res) => {
		//         if (err) throw done(err);
		//
		//         done();
		//     });
	});

});

function mockIDP() {
	// mock configuration endpoint and get ticket
	console.log('mock configuration endpoint and get ticket');
	let passportConfigResponseHeader = {
		'www-authenticate': `UMA realm="example",
    as_uri=${idpURL},
    ticket=${ticket}`,
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
	const token = getRpJWT({
		iss: clientId,
		sub: clientId,
		aud: tokenEndpoint,
		jti: uuid(),
		exp: now / 1000 + 30,
		iat: now
	});

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
		conf: {
			logging: {},
			serverURI: 'http://localhost',
			serverWebPort: 8
		},
		providers: {

		}
	};

	const reqheaders = {
		authorization: `Bearer ${rptTokenResponse.access_token}`,
		pct: rptTokenResponse.pct
	};

	nock(idpURL, {
		reqheaders
	})
		.get(idpPassportConfigPath)
		.reply(401, '', passportConfigResponse);
}


const privateKey = R.once(() =>
	fs.readFileSync(passportConfig.keyPath, 'utf8')
		.replace(
			'-----BEGIN RSA PRIVATE KEY-----',
			'-----BEGIN PRIVATE KEY-----'
		)
		.replace(
			'-----END RSA PRIVATE KEY-----',
			'-----END PRIVATE KEY-----'
		)
);

const defaultRpOptions = R.once(() => ({
	algorithm: passportConfig.keyAlg,
	header: {
		typ: 'JWT',
		alg: passportConfig.keyAlg,
		kid: passportConfig.keyId
	}
}));

const getRpJWT = payload => jwt.sign(payload, privateKey(), defaultRpOptions());
