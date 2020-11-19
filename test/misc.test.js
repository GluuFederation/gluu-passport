/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const misc = require('../server/utils/misc')
const rewire = require('rewire')
const rewiredMisc = rewire('../server/utils/misc.js')
const sinon = require('sinon')

const assert = chai.assert

describe('misc.getDefaultValueIfUnexistant', () => {
  it('shoud exist', () => {
    assert.exists(misc.assignDefaultValueIfUnexistant)
  })
  it('should be a function', () => {
    assert.isFunction(misc.assignDefaultValueIfUnexistant)
  })

  it('should throw error if object if defaultValue is unexistant', () => {
    const object = {}
    let unexistant
    assert.throws(() => {
      misc.assignDefaultValueIfUnexistant(unexistant, object)
    },
    'defaultValue cannot be undefined, NaN or null')
  })

  it('should not throw error if defaultValue exists', () => {
    const object = {}
    const existant = 'existantValue'
    assert.doesNotThrow(() => {
      misc.assignDefaultValueIfUnexistant(existant, object)
    },
    'defaultValue cannot be undefined, NaN or null')
  })

  it('should return defaultValue if object is unexistant', () => {
    let unexistantObject
    const defaultValue = 'myDefaultValue'
    assert.strictEqual(
      misc.assignDefaultValueIfUnexistant(defaultValue, unexistantObject),
      defaultValue
    )
  })

  it('should return object if object exists', () => {
    const existantObject = { exists: true }
    const defaultValue = 'anyNonEmptyValue'
    assert.strictEqual(
      misc.assignDefaultValueIfUnexistant(defaultValue, existantObject),
      existantObject
    )
  })
})

describe('misc.randomSecret', () => {
  it('should exist', () => {
    assert.exists(misc.randomSecret)
  })

  it('should be function', () => {
    assert.isFunction(misc.randomSecret)
  })

  it('should call crypto once', () => {
    const crypto = rewiredMisc.__get__('crypto')
    const randomBytesSpy = sinon.spy(crypto, 'randomBytes')
    const randomSecret = rewiredMisc.__get__('randomSecret')

    randomSecret()

    sinon.assert.calledOnce(randomBytesSpy)
  })
})

describe('misc.arrify', () => {
  /* This functions aims at transforming every key value
   of an object in the following way:

  "" --> []
  "hi" --> ["hi"]
  ["hi", "there"] --> ["hi", "there"]
  [{"attr":"hi"}, {"attr":"there"}] --> ['{"attr":"hi"}', '{"attr":"there"}']
  {"attr":"hi"} --> ['{"attr":"hi"}']
  [] --> []
  null --> []
  undefined --> []
  Object members which are functions are dropped
  */

  it('arrify should transform { "mail" : ""} in { mail : [] } ', () => {
    assert.deepEqual(
      misc.arrify({ mail: '' }),
      { mail: [] }
    )
  })

  it('arrify should transform { "username" : "johndoe" }' +
  ' in { "username" : ["johndoe"] }', () => {
    assert.deepEqual(
      misc.arrify({ username: 'johndoe' }),
      { username: ['johndoe'] }
    )
  })

  it('arrify should transform ' +
  '{ "mail" : [ "business@mail.com" , "personal@mail.com"] }' +
  ' in { "mail" : [ "business@mail.com" , "personal@mail.com"] }', () => {
    assert.deepEqual(
      misc.arrify({
        mail:
      ['business@mail.com', 'personal@mail.com']
      }),
      { mail: ['business@mail.com', 'personal@mail.com'] }
    )
  })

  it(' { "job" : [{"company":"gluu"}, {"role":"devops"}] } ' +
  'in { "job" : ["{"company":"gluu"}", "{"role":"devops"}"] }', () => {
    assert.deepEqual(
      misc.arrify(
        { job: [{ company: 'gluu' }, { role: 'devops' }] }
      ),
      { job: ['{"company":"gluu"}', '{"role":"devops"}'] }
    )
  })

  it(' { "mail" : { "gmail" : "johndoe@gmail.com" } } ' +
  'in { "mail" : ["{"gmail" : "johndoe@gmail.com"}"] }', () => {
    assert.deepEqual(
      misc.arrify({ mail: { gmail: 'johndoe@gmail.com' } }),
      { mail: ['{"gmail":"johndoe@gmail.com"}'] }
    )
  })

  it(' { profiles : [] } --> { profiles : [] }', () => {
    assert.deepEqual(
      misc.arrify({ profiles: [] }),
      { profiles: [] }
    )
  })

  it(' { profiles : undefined } --> { profiles : [] }', () => {
    assert.deepEqual(
      misc.arrify({ profiles: undefined }),
      { profiles: [] }
    )
  })

  it(' { profiles : null } --> { profiles : [] }', () => {
    assert.deepEqual(
      misc.arrify({ profiles: null }),
      { profiles: [] }
    )
  })

  // Object members which are functions are dropped
  it(' { key: function() { return 0; }, key2: "hi" } --> { key2: ["hi"] }',
    () => {
      assert.deepEqual(
        misc.arrify({ key: function () { return 0 }, key2: 'hi' }),
        { key2: ['hi'] }
      )
    })
})
