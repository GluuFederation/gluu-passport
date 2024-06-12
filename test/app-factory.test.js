
const chai = require('chai')
const assert = chai.assert
const rewire = require('rewire')
const appFactoryRewire = rewire('../server/app-factory.js')
const sinon = require('sinon')

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
  return { appUseSpy, app }
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
    const flash = require('connect-flash')
    const { appUseSpy } = spyOnAppUse()

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
    const { appUseSpy } = spyOnAppUse()
    assertCalledWithFunctionAsArg(appUseSpy, rewiredGlobalErrorHandler)
    sinon.restore()
  })
})

describe('empty rateLimiter middleware', () => {
  let app
  it('app should have rateLimiter', () => {
    const spyApp = spyOnAppUse()
    app = spyApp.app
    assert.exists(app.rateLimiter)
  })

  it('app should have rateLimiter as a function', () => {
    assert.isFunction(app.rateLimiter)
    sinon.restore()
  })
})

describe('empty session middleware', () => {
  let app
  it('app should have session', () => {
    const spyApp = spyOnAppUse()
    app = spyApp.app
    assert.exists(app.session)
  })

  it('app should have session as a function', () => {
    assert.isFunction(app.session)
    sinon.restore()
  })
})

describe('session middleware', () => {
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
