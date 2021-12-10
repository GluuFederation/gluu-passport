const chai = require('chai')
const rewire = require('rewire')
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

  const rateLimit = rateLimiter.__get__('rateLimit')
  it('rateLimit should be exist', () => {
    assert.exists(rateLimit)
  })

  it('rateLimit should be function', () => {
    assert.isFunction(rateLimit)
  })
})
