const chai = require('chai')
const assert = chai.assert

/**
 * Testing configs (env) on /config/*.js (uses node-config module)
 */

const defaultcfg = require('../config/default.js')
const productioncfg = require('../config/production.js')

describe('defaultcfg', function () {
  it('default.js should have passportFile not null or undefined', () => {
    assert.exists(
      defaultcfg.passportFile, 'passportFile is not null or undefined')
  })

  it('default.js should have saltFile not null or undefined', () => {
    assert.exists(
      defaultcfg.saltFile, 'saltFile is not null or undefined')
  })
})

describe('productioncfg', function () {
  it('production.js should have passportFile  not null or undefined', () => {
    assert.exists(
      productioncfg.passportFile, 'passportFile is not null or undefined')
  })
  it('production.js should have saltFile not null or undefined', () => {
    assert.exists(
      productioncfg.saltFile, 'saltFile is not null or undefined')
  })
  it('production.js shoud have sameSite', () => {
    assert.exists(
      productioncfg.sameSite, 'sameSite does not exist'
    )
  })
  it('production.js should have sameSite value none', () => {
    assert.equal(productioncfg.sameSite, 'none', 'sameSite value is NOT none')
  })
})
