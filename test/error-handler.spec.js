/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const sinon = require('sinon')
const got = require('got')
const { globalErrorHandler } = require('../server/utils/error-handler.js')

const assert = chai.assert

async function generateStrategyError () {
  const provider = 'apple'
  const options = {
    method: 'POST',
    url: `http://127.0.0.1:8090/passport/auth/${provider}/callback`,
    json: {
      state: 'xxxxxxxxxxxx',
      error: 'user_cancelled_authorize'
    },
    responseType: 'json',
    throwHttpErrors: false,
    followRedirect: true
  }
  const response = await got(options)
  const headers = response.headers
  assert.equal(headers.location, '/passport/error')
}

describe('error-handler.js test', () => {
  it('should call globalErrorHandler with correct error message', () => {
    const globalErrorHandlerSpy = sinon.spy(globalErrorHandler)
    generateStrategyError()
    assert(globalErrorHandlerSpy.calledOnce)
    sinon.restore()
  })
})
