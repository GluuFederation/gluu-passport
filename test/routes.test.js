const chai = require('chai')
const assert = chai.assert
const got = require('got')
const sinon = require('sinon')
const webUtils = require('../server/utils/web-utils')
const InitMock = require('./testdata/init-mock')
const initMock = new InitMock()

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore()
})

describe('Error message should not have inputs', () => {
  before(() => {
    initMock.errorHandlerEndpoint()
  })
  // initMock.errorHandlerEndpoint()
  it('metadata request error should not have metaFileName', async () => {
    const unexistantIdp = 'idonotexist'
    const response = await got(
        `http://127.0.0.1:8090/passport/auth/meta/idp/${unexistantIdp}`,
        { throwHttpErrors: false }
    )
    assert.notInclude(response.body, unexistantIdp)
  })
  it('providers get routes should not throw error with provider name', async () => {
    const webUtilsSpy = sinon.spy(webUtils, 'handleError')
    const provider = 'idontexist'
    const token = 'whateveRt0k3n'
    await got(
      `http://127.0.0.1:8090/passport/auth/${provider}/${token}`,
      { throwHttpErrors: false }
    )
    sinon.assert.calledOnce(webUtilsSpy)
    assert.notInclude(webUtilsSpy.getCall(0).lastArg, provider)
  })
})
