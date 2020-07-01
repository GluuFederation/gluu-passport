const mocha = require('mocha')
const chai = require('chai')
const defaultcfg = require('../config/default.json')
const productioncfg = require('../config/production.json')

const assert = chai.assert

describe('defaultcfg', function() {
	it('default.json should have passportFile not null or undefined', () => {
		assert.exists(defaultcfg.passportFile, 'passportFile is not null or undefined')
	})

	it('default.json should have saltFile not null or undefined', () => {
		assert.exists(defaultcfg.saltFile, 'saltFile is not null or undefined')
	})
})

describe('productioncfg', function() {
	it('production.json should have passportFile  not null or undefined', () => {
		assert.exists(productioncfg.passportFile, 'passportFile is not null or undefined')
	})
	it('default.json should have saltFile not null or undefined', () => {
		assert.exists(productioncfg.saltFile, 'saltFile is not null or undefined')
	})
})

