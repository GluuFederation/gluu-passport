/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const sinon = require('sinon')
const { globalErrorHandler, handleStrategyError, StrategyError } = require('../server/utils/error-handler.js')
const config = require('config')

const assert = chai.assert
const expect = chai.expect

describe('error-handler.js test', () => {
  it('globalErrorHandler should exist', () => {
    assert.exists(globalErrorHandler)
  })

  it('globalErrorHandler should be function', () => {
    assert.isFunction(globalErrorHandler)
  })

  it('globalErrorHandler should call redirect with expected args', () => {
    const res = {
      redirect: sinon.spy()
    }

    globalErrorHandler({ stack: 'fake' }, {}, res, {})
    const failureRedirectUrl = config.get('passportConfig.failureRedirectUrl')
    expect(res.redirect.calledOnce).to.be.true
    expect(res.redirect.firstCall.args[0]).to.equal(
      `${failureRedirectUrl}?failure=An error occurred`
    )
  })

  it('StrategyError should exist', () => {
    assert.exists(StrategyError)
  })

  it('StrategyError should be function', () => {
    assert.isFunction(StrategyError)
  })

  describe('handleStrategyError', () => {
    it('should exist importable', () => {
      expect(handleStrategyError).to.exist()
    })

    it('should throw StrategyError with req.flash message', () => {
      const errorMessage = 'StrategyError: A valid strategy error message'

      const requestStub = {
        flash: (type, msg) => {
          return errorMessage
        }
      }

      const responseStub = () => {
        const res = {}
        res.status = sinon.stub().returns(res)
        res.json = sinon.stub().returns(res)
        return res
      }
      expect(
        () => {
          handleStrategyError(requestStub, responseStub())
        }
      ).to.throw()

      expect(
        () => {
          handleStrategyError(requestStub, responseStub())
        }
      ).to.throw(StrategyError)

      expect(
        () => {
          handleStrategyError(requestStub, responseStub())
        }
      ).to.throw(StrategyError, errorMessage)
    })

    it('should not throw if req.flash error does not exist', () => {
    // implement test after all tests above passes, then code.
      assert.fail('Not implemented')
    })
  })
})
