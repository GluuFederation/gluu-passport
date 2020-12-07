const chai = require('chai')
const assert = chai.assert

/**
 * Helper: Returns the argument call number with matching args
 * If none found, returns undefined
 * @param {*} spyFn sinon.Spy function
 * @param {*} argFn callback / function param
 */

// eslint-disable-next-line no-unused-vars
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
