const chai = require('chai')
const defaultcfg = require('../config/default.js')
const productioncfg = require('../config/production.js')

const assert = chai.assert

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
})

