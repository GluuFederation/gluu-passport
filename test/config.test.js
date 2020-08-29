const fs = require('fs');
const request = require('supertest');
const config = require('config');
const helper = require('./helper.js');
const chai = require('chai')
const assert = chai.assert


/**
 * Testing config
 */
const {passportConfig, passportConfigResponse, passportRPPEM, passportSPCert, passportSPKey} = helper;

const defaultcfg = require('../config/default.js');
const productioncfg = require('../config/production.js');
const passportConfigFile = config.get('passportFile');
const passportRPPEMFile = passportConfig.keyPath;

// generate new passport config file
// fs.writeFileSync(passportConfigFile, JSON.stringify(passportConfig));
// process.env.passport_config_file = passportConfigFile;
// process.env.config_update_timer = 600000;

// passport certs
fs.writeFileSync(passportRPPEMFile, passportRPPEM);
fs.writeFileSync(passportConfigResponse.conf.spTLSCert, passportSPCert);
fs.writeFileSync(passportConfigResponse.conf.spTLSKey, passportSPKey);

/**
 * root level hooks
 */

// before((done) => {
// 	helper.mockIDP();
// 	// init and get/set all config
// 	global.app = require('../server/app');
//
// 	const serverStart = setInterval(() => {
// 		// need again re-initialize, now server started
// 		global.app = require('../server/app');
//
// 		if(!app.address) {
// 			return
// 		}
// 		// start the server and ready to request
// 		request(app)
// 			.get('/passport/health-check') // Calling Endpoint /passport/health-check
// 			.expect(200)
// 			.end((err, res) => {
// 				if (err) return done(err);
//
// 				clearInterval(serverStart);
// 				done();
// 			});
// 	}, 500);
// });
//
// after((done) => {
// 	fs.unlinkSync(passportConfigFile);
// 	fs.unlinkSync(passportRPPEMFile);
// 	fs.unlinkSync(passportConfigResponse.conf.spTLSCert);
// 	fs.unlinkSync(passportConfigResponse.conf.spTLSKey);
// 	// Todo: need to find why test case not stoping process, press ctrl + c to stop for now
// 	app.close(done);
// });

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
