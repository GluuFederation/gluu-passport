import chai from 'chai'
import esmock from 'esmock'

const assert = chai.assert

const mockAppFactory = async () => {
  return esmock('../server/app-factory.js', {})
}

const testModuleAdded = (middlewares, module) => {
  assert.isTrue(middlewares.includes(module))
}

describe('app middleware', () => {
  let mockedAppFactory, app, middlewares

  before(async () => {
    mockedAppFactory = await mockAppFactory()
    const appFactory = new mockedAppFactory.AppFactory()
    app = appFactory.createApp()
    middlewares = app._router.stack.map((middleware) => middleware.name)
  })

  after(() => {
    esmock.purge(mockedAppFactory)
  })

  it('should be add logger middleware in app', () => {
    testModuleAdded(middlewares, 'logger')
  })

  it('should be add session middleware in app', () => {
    testModuleAdded(middlewares, 'session')
  })

  it('should be add rateLimit middleware in app', () => {
    testModuleAdded(middlewares, 'rateLimit')
  })

  it('should be add jsonParser middleware in app', () => {
    testModuleAdded(middlewares, 'jsonParser')
  })

  it('should be add cookieParser middleware in app', () => {
    testModuleAdded(middlewares, 'cookieParser')
  })

  it('should be add urlencodedParser middleware in app', () => {
    testModuleAdded(middlewares, 'urlencodedParser')
  })

  it('should be add globalErrorHandler middleware in app', () => {
    testModuleAdded(middlewares, 'globalErrorHandler')
  })
})
