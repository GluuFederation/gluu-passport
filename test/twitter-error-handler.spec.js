const chai = require('chai')
const sinon = require('sinon')
const twitterErrorHandler = require('../server/utils/twitter-error-handler')
const logger = require('../server/utils/logging')
const { initTwitterStrategy } = require('./helper')

const expect = chai.expect

describe('twitter-error-handler.js test', () => {
  it('stratergy should call overrided function', () => {
    const strategy = initTwitterStrategy()
    twitterErrorHandler()
    const loggerSpy = sinon.stub(logger, 'log2')
    strategy.parseErrorResponse({ errors: ['Fail'] }, 401)
    expect(loggerSpy.calledOnce)
    expect(loggerSpy.firstCall.args[1]).to.equal('catched error in custom twitter error handler')
    sinon.reset()
  })
})
