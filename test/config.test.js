const chai = require('chai')
const rewire = require('rewire')
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

  it('default.js should have cookieSameSite value lax', () => {
    assert.exists(defaultcfg.cookieSameSite, 'cookieSameSite does NOT exists')
    assert.equal(defaultcfg.cookieSameSite, 'lax', 'cookieSameSite value is NOT lax')
  })

  it('default.js should have cookieSecure value false', () => {
    assert.exists(
      defaultcfg.cookieSecure, 'cookieSecure does NOT exist'
    )
    assert.isFalse(defaultcfg.cookieSecure)
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

  describe('test timerInterval', () => {
    it('should have value', () => {
      assert.exists(productioncfg.timerInterval, 'timerInterval does not exist')
    })
    it('should be in number type', () => {
      assert.isNumber(productioncfg.timerInterval)
      process.env.PASSPORT_TIMER_INTERVAL = 70000
      assert.isNumber(rewire('../config/production.js').timerInterval)
    })
    it('should have default values 60000 if no envs', () => {
      assert.equal(productioncfg.timerInterval, 60000)
    })
    it('should have envs values if envs available', () => {
      const timerInterval = 70000
      process.env.PASSPORT_TIMER_INTERVAL = timerInterval
      const rewireProductionConfig = rewire('../config/production.js')
      assert.equal(rewireProductionConfig.timerInterval, timerInterval)
    })
  })

  describe('test rateLimitWindowMs', () => {
    it('should have value', () => {
      assert.exists(productioncfg.rateLimitWindowMs, 'rateLimitWindowMs does not exist')
    })
    it('should be in number type', () => {
      assert.isNumber(productioncfg.rateLimitWindowMs)
      process.env.PASSPORT_TIMER_INTERVAL = 30 * 60 * 60 * 1000
      assert.isNumber(rewire('../config/production.js').rateLimitWindowMs)
    })
    it('should have default values 24 * 60 * 60 * 1000 if no envs', () => {
      assert.equal(productioncfg.rateLimitWindowMs, 24 * 60 * 60 * 1000)
    })
    it('should have envs values if envs available', () => {
      const rateLimitWindowMs = 30 * 60 * 60 * 1000
      process.env.PASSPORT_RATE_LIMIT_WINDOW_MS = rateLimitWindowMs
      const rewireProductionConfig = rewire('../config/production.js')
      assert.equal(rewireProductionConfig.rateLimitWindowMs, rateLimitWindowMs)
    })
  })

  describe('test rateLimitMaxRequestAllow', () => {
    it('should have value', () => {
      assert.exists(productioncfg.rateLimitMaxRequestAllow, 'rateLimitMaxRequestAllow does not exist')
    })
    it('should be in number type', () => {
      assert.isNumber(productioncfg.rateLimitMaxRequestAllow)
      process.env.PASSPORT_RATE_LIMIT_MAX_REQUEST_ALLOW = 5000
      assert.isNumber(rewire('../config/production.js').rateLimitMaxRequestAllow)
    })
    it('should have default values 1000 if no envs', () => {
      assert.equal(productioncfg.rateLimitMaxRequestAllow, 1000)
    })
    it('should have envs values if envs available', () => {
      const rateLimitMaxRequestAllow = 5000
      process.env.PASSPORT_RATE_LIMIT_MAX_REQUEST_ALLOW = rateLimitMaxRequestAllow
      const rewireProductionConfig = rewire('../config/production.js')
      assert.equal(rewireProductionConfig.rateLimitMaxRequestAllow, rateLimitMaxRequestAllow)
    })
  })

  describe('test cookieSameSite', () => {
    it('should have value', () => {
      assert.exists(productioncfg.cookieSameSite, 'cookieSameSite does not exist')
    })
    it('should be in string type', () => {
      assert.isString(productioncfg.cookieSameSite)
    })
    it('should have default values none if no envs', () => {
      assert.equal(productioncfg.cookieSameSite, 'none')
    })
    it('should have envs values if envs available', () => {
      const cookieSameSite = 'lax'
      process.env.PASSPORT_COOKIE_SAME_SITE = cookieSameSite
      const rewireProductionConfig = rewire('../config/production.js')
      assert.equal(rewireProductionConfig.cookieSameSite, cookieSameSite)
    })
  })

  describe('test cookieSecure', () => {
    it('should have value', () => {
      assert.exists(productioncfg.cookieSecure, 'cookieSecure does not exist')
    })
    it('should be in boolean type', () => {
      assert.isBoolean(productioncfg.cookieSecure)
      process.env.PASSPORT_COOKIE_SECURE = 'false'
      assert.isBoolean(rewire('../config/production.js').cookieSecure)
    })
    it('should have default values true if no envs', () => {
      assert.equal(productioncfg.cookieSecure, true)
    })
    it('should have envs values if envs available', () => {
      process.env.PASSPORT_COOKIE_SECURE = 'false'
      const rewireProductionConfig = rewire('../config/production.js')
      assert.equal(rewireProductionConfig.cookieSecure, false)
    })
  })
})
