import chai from 'chai'
import esmock from 'esmock'

const assert = chai.assert

const mockAppFactory = async () => {
  return await esmock('../server/app-factory.js', {})
}

describe('app middleware', () => {
  let mockedAppFactory, app, middlewares

  before(async () => {
    mockedAppFactory = await mockAppFactory()
    const appFactory = new mockedAppFactory.AppFactory()
    app = appFactory.createApp()
    middlewares = app._router.stack.map((middleware) => middleware.name)
    console.log(middlewares)
  })

  after(() => {
    esmock.purge(mockedAppFactory)
  })

  it('should be add logger middleware in app', () => {
    assert.isTrue(middlewares.includes('logger'))
  })

  it('should be add session middleware in app', () => {
    assert.isTrue(middlewares.includes('session'))
  })

  it('should be add rateLimit middleware in app', () => {
    assert.isTrue(middlewares.includes('rateLimit'))
  })

  it('should be add jsonParser middleware in app', () => {
    assert.isTrue(middlewares.includes('jsonParser'))
  })

  it('should be add cookieParser middleware in app', () => {
    assert.isTrue(middlewares.includes('cookieParser'))
  })

  it('should be add urlencodedParser middleware in app', () => {
    assert.isTrue(middlewares.includes('urlencodedParser'))
  })

  it('should be add globalErrorHandler middleware in app', () => {
    assert.isTrue(middlewares.includes('globalErrorHandler'))
  })
})
