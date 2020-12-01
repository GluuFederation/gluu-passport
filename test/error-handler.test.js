const chai = require('chai')
const sinon = require('sinon')
const { globalErrorHandler } = require('../server/utils/error-handler.js')
const test = require('../config/test')

const assert = chai.assert
const expect = chai.expect

describe('error-handler.js test', () => {
  it('globalErrorHandler should exist', () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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
})
