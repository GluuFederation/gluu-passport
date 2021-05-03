const chai = require('chai')
const twitterErrorHandler = require('../server/utils/twitter-error-handler')
const logger = require('../server/utils/logging')
const sinon = require('sinon')
const { initTwitterStrategy } = require('./helper')

const assert = chai.assert
const expect = chai.expect

describe('twitter-error-handler.js test', () => {
  it('twitterErrorHandler should exist', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    assert.exists(twitterErrorHandler)
  })

  it('twitterErrorHandler should be function', () => {
    assert.isFunction(twitterErrorHandler)
  })

  const loggerSpy = sinon.stub(logger, 'log2')

  it('before override, strategy should not call override function', () => {
    const strategy = initTwitterStrategy()
    strategy.parseErrorResponse({ errors: ['Fail'] }, 401)
    expect(loggerSpy.calledOnce).to.equal(false)
    sinon.reset()
  })

  it('after override, strategy should call override function', () => {
    const strategy = initTwitterStrategy()
    twitterErrorHandler()
    const loggerSpy = sinon.stub(logger, 'log2')
    strategy.parseErrorResponse({ errors: ['Fail'] }, 401)
    expect(loggerSpy.calledOnce)
    expect(loggerSpy.firstCall.args[1]).to.equal('catched error in custom twitter error handler')
    sinon.reset()
  })
})
