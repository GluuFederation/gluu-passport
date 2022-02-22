import chai from 'chai'
import got from 'got'
import sinon from 'sinon'
import config from 'config'
import InitMock from './testdata/init-mock.js'

const assert = chai.assert
const initMock = new InitMock()
const passportConfig = config.get('passportConfig')

describe('routes.js', () => {
  describe('security - normalization', () => {
    before(() => {
      initMock.errorHandlerEndpoint()
    })
    afterEach(() => {
      // Restore the default sandbox here
      sinon.restore()
    })

    it('metadata request error should not have metaFileName', async () => {
      const unexistantIdp = 'idonotexist'
      const response = await got(
          `http://127.0.0.1:8090/passport/auth/meta/idp/${unexistantIdp}`,
          { throwHttpErrors: false }
      )
      assert.notInclude(response.body, unexistantIdp)
    })

    it('user deny access, passport should redirect to /error endpoint', async () => {
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
        followRedirect: false
      }
      const response = await got(options)
      const headers = response.headers
      assert.equal(headers.location, '/passport/error')
    })
    it('called /error endpoint, passport should redirect to config failureRedirect Url', async () => {
      const response = await got(
        'http://127.0.0.1:8090/passport/error',
        { throwHttpErrors: false, followRedirect: false }
      )
      const headers = response.headers
      assert.equal(headers.location, `${passportConfig.failureRedirectUrl}?failure=An%20error%20occurred`)
    })
  })
})
