/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const assert = chai.assert
const rewire = require('rewire')
const appFactoryRewire = rewire('../server/app-factory.js')
const sinon = require('sinon')

/**
 * Helper: Returns the argument call number with matching args
 * If none found, returns undefined
 * @param {*} spyFn sinon.Spy function
 * @param {*} argFn callback / function param
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

describe('csurf middleware', () => {
  const rewiredCsurf = appFactoryRewire.__get__('csurf')

  it('should exist', () => {
    assert.exists(rewiredCsurf)
  })

  it('should be a function', () => {
    assert.isFunction(rewiredCsurf)
  })

  it('should be equal csurf module', () => {
    assert.strictEqual(rewiredCsurf, require('csurf'))
  })

  it('should be called once as app.use arg', () => {
    const csurf = require('csurf')
    const app = appFactoryRewire.__get__('app')
    const AppFactory = appFactoryRewire.__get__('AppFactory')
    const appUseSpy = sinon.spy(app, 'use')
    const appInstance = new AppFactory()

    appInstance.createApp()

    assertCalledWithFunctionAsArg(appUseSpy, csurf({ cookies: true }))
    sinon.restore()
  })
})

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
    const app = appFactoryRewire.__get__('app')
    const AppFactory = appFactoryRewire.__get__('AppFactory')
    const appUseSpy = sinon.spy(app, 'use')
    const appInstance = new AppFactory()

    appInstance.createApp()

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
    const app = appFactoryRewire.__get__('app')
    const AppFactory = appFactoryRewire.__get__('AppFactory')
    const appUseSpy = sinon.spy(app, 'use')
    const appInstance = new AppFactory()

    appInstance.createApp()
    assertCalledWithFunctionAsArg(appUseSpy, rewiredGlobalErrorHandler)
    sinon.restore()
  })
})
