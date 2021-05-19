/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const sinon = require('sinon')
const { globalErrorHandler, StrategyError } = require('../server/utils/error-handler.js')
const test = require('../config/test')

const assert = chai.assert
const expect = chai.expect

describe('error-handler.js test', () => {
  it('globalErrorHandler should exist', () => {
    assert.exists(globalErrorHandler)
  })

  it('globalErrorHandler should be function', () => {
    assert.isFunction(globalErrorHandler)
  })

  it('globalErrorHandler should redirect to login page', () => {
    const res = {
      redirect: sinon.spy()
    }

    globalErrorHandler({ stack: 'fake' }, {}, res, {})
    expect(res.redirect.calledOnce).to.be.true
    expect(res.redirect.firstCall.args[0]).to.equal(`${test.passportConfig.failureRedirectUrl}?failure=An error occurred`)
  })

  it('StrategyError should exist', () => {
    assert.exists(StrategyError)
  })

  it('StrategyError should be function', () => {
    assert.isFunction(StrategyError)
  })

  it('StrategyError should allow to create error object', () => {
    const oStrategyError = new StrategyError('Failed to get token')
    assert(oStrategyError.name === 'StrategyError')
    assert(oStrategyError.message === 'Failed to get token')
    assert(typeof (oStrategyError) === 'object')
  })
})
