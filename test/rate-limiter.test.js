import chai from 'chai'
import { windowMs, rateLimiter, max } from '../server/utils/rate-limiter.js'
import config from 'config'
import rateLimit from 'express-rate-limit'

const assert = chai.assert

describe('rate-limiter.js test', () => {
  it('windowMs should exist', () => {
    assert.exists(windowMs)
  })

  it('windowMs should be number', () => {
    assert.isNumber(windowMs)
  })

  it('windowMs should be equals to config value', () => {
    assert.equal(windowMs, config.get('rateLimitWindowMs'))
  })

  it('max should exist', () => {
    assert.exists(max)
  })

  it('max should be number', () => {
    assert.isNumber(max)
  })

  it('max should be equals to config value', () => {
    assert.equal(max, config.get('rateLimitMaxRequestAllow'))
  })

  it('rateLimiter should exist', () => {
    assert.exists(rateLimiter)
  })

  it('rateLimiter should be function', () => {
    assert.isFunction(rateLimiter)
  })

  it('rateLimiter should be equals to express-rate-limit module', () => {
    assert.isFunction(rateLimiter, rateLimit())
  })
})
