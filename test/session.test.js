const chai = require('chai')
const rewire = require('rewire')
const sinon = require('sinon')

const logger = require('../server/utils/logging')
const session = rewire('../server/utils/session')
const assert = chai.assert

describe('session.js test', () => {
  const configure = session.__get__('configure')
  it('configure should be exist', () => {
    assert.exists(configure)
  })

  it('configure should be function', () => {
    assert.isFunction(configure)
  })

  it('configure should init a express-session', () => {
    const app = {}
    configure(app, 'none', true)
    assert.exists(app.session)
  })

  it('configure should configure with correct values', () => {
    const checkCookieSameSite = session.__get__('checkCookieSameSite')
    const checkCookieSecure = session.__get__('checkCookieSecure')
    assert.equal(checkCookieSameSite, 'none')
    assert.equal(checkCookieSecure, true)
  })

  it('configure should not reconfigure express-session once values are same', () => {
    const sinonSpy = sinon.spy(logger, 'log2')
    configure({}, 'none', true)
    assert.isTrue(sinonSpy.calledOnceWith('debug', 'Skip session config, already config with same values'))
    sinonSpy.restore()
  })

  const expressSession = session.__get__('expressSession')
  it('express-session should be exist', () => {
    assert.exists(expressSession)
  })

  it('express-session should be function', () => {
    assert.isFunction(expressSession)
  })
})
