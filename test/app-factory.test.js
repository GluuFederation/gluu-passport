import chai from 'chai'
import rewire from 'rewire'
import sinon from 'sinon'
import rateLimiter from '../server/utils/rate-limiter.js'
import flash from 'connect-flash'
import session from '../server/utils/session.js'

const appFactoryRewire = rewire('../server/app-factory.js')
const assert = chai.assert

/**
 * Helper: Returns the argument call number with matching args
 * If none found, returns undefined
 * @param {Function} spyFn sinon.Spy function
 * @param {Function} argFn callback / function param
 */

function assertCalledWithFunctionAsArg (spyFn, argFn) {
  const calls = spyFn.getCalls()
  const argFnString = argFn.toString()
  let foundMatch = false
  for (const call in calls) {
    const arg = spyFn.getCall(call).args[0]
    if (arg.toString() === argFnString) {
      // foundCall = spyFn.getCall(call)
      foundMatch = true
    }
  }
  assert(foundMatch === true,
    'Spy function/method was not called with expected function')
}

/**
 * spy on app.use
 */
function spyOnAppUse () {
  const app = appFactoryRewire.__get__('app')
  const AppFactory = appFactoryRewire.__get__('AppFactory')
  const appUseSpy = sinon.spy(app, 'use')
  const appInstance = new AppFactory()

  appInstance.createApp()
  return appUseSpy
}

describe('connect-flash middleware', () => {
  const rewiredFlash = appFactoryRewire.__get__('flash')

  it('should exist', () => {
    assert.exists(rewiredFlash)
  })

  it('should be a function', () => {
    assert.isFunction(rewiredFlash)
  })

  it('should be equal connect-flash module', () => {
    assert.strictEqual(rewiredFlash, require('connect-flash'))
  })

  it('should be called once as app.use arg', () => {
    const appUseSpy = spyOnAppUse()

    assertCalledWithFunctionAsArg(appUseSpy, flash())
    sinon.restore()
  })
})

describe('error-handler middleware', () => {
  const rewiredGlobalErrorHandler = appFactoryRewire.__get__('globalErrorHandler')

  it('should exist', () => {
    assert.exists(rewiredGlobalErrorHandler)
  })

  it('should be a function', () => {
    assert.isFunction(rewiredGlobalErrorHandler)
  })

  it('should be called once as app.use arg', () => {
    const appUseSpy = spyOnAppUse()
    assertCalledWithFunctionAsArg(appUseSpy, rewiredGlobalErrorHandler)
    sinon.restore()
  })
})

describe('rateLimiter middleware', () => {
  const rewiredRateLimiter = appFactoryRewire.__get__('rateLimiter')

  it('should exist', () => {
    assert.exists(rewiredRateLimiter)
  })

  it('should be a function', () => {
    assert.isFunction(rewiredRateLimiter)
  })

  it('should be equal rateLimiter middleware', () => {
    assert.strictEqual(rewiredRateLimiter, rateLimiter)
  })

  it('should be called once as app.use arg', () => {
    const appUseSpy = spyOnAppUse()
    assertCalledWithFunctionAsArg(appUseSpy, rewiredRateLimiter)
    sinon.restore()
  })
})

describe('session middleware', () => {
  const rewiredSession = appFactoryRewire.__get__('session')
  it('should exist', () => {
    assert.exists(rewiredSession)
  })

  it('should be a function', () => {
    assert.isFunction(rewiredSession)
  })

  it('should be equal session middleware', () => {
    assert.equal(rewiredSession, session)
  })

  it('should be called once as app.use arg', () => {
    const appUseSpy = spyOnAppUse()
    assertCalledWithFunctionAsArg(appUseSpy, rewiredSession)
    sinon.restore()
  })

  describe('proxy setup', () => {
    it('app.set should be called once w/ params', () => {
      const app = appFactoryRewire.__get__('app')
      const AppFactory = appFactoryRewire.__get__('AppFactory')
      const appSetSpy = sinon.spy(app, 'set')
      const appInstance = new AppFactory()
      appInstance.createApp()
      sinon.assert.calledWith(appSetSpy, 'trust proxy', 1)
      sinon.restore()
    })
  })
})
