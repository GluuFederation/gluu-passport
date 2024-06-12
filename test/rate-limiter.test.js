const chai = require('chai')
const rewire = require('rewire')
const sinon = require('sinon')

const logger = require('../server/utils/logging')
const rateLimiter = rewire('../server/utils/rate-limiter')
const assert = chai.assert

describe('rate-limiter.js test', () => {
  const configure = rateLimiter.__get__('configure')
  it('configure should be exist', () => {
    assert.exists(configure)
  })

  it('configure should be function', () => {
    assert.isFunction(configure)
  })

  it('configure should init a express-rate-limit with resetKey function', () => {
    const app = {}
    configure(app, 10000, 10)
    assert.exists(app.rateLimiter)
    assert.isDefined(app.rateLimiter.resetKey)
  })

  it('configure should configure with correct values', () => {
    const checkWindowMs = rateLimiter.__get__('checkWindowMs')
    const checkMax = rateLimiter.__get__('checkMax')
    assert.equal(checkWindowMs, 10000)
    assert.equal(checkMax, 10)
  })

  it('configure should not reconfigure express-rate-limit once values are same', () => {
    const sinonSpy = sinon.spy(logger, 'log2')
    configure({}, 10000, 10)
    assert.isTrue(sinonSpy.calledOnceWith('debug', 'Skip ratelimit config, already config with same values'))
    sinonSpy.restore()
  })

  const rateLimit = rateLimiter.__get__('rateLimit')
  it('rateLimit should be exist', () => {
    assert.exists(rateLimit)
  })

  it('rateLimit should be function', () => {
    assert.isFunction(rateLimit)
  })
})
