import chai from 'chai'
import esmock from 'esmock'

const assert = chai.assert

const mockMiscModule = async () => {
  return esmock('../server/utils/misc.js', {
    crypto: {
      randomBytes: (no) => 'randomBuffer'
    }
  })
}

describe('misc.randomSecret', () => {
  let mockMisc
  before(async () => {
    mockMisc = await mockMiscModule()
  })

  after(() => {
    esmock.purge(mockMisc)
  })

  it('should exist', () => {
    assert.exists(mockMisc.randomSecret)
  })

  it('should be function', () => {
    assert.isFunction(mockMisc.randomSecret)
  })

  it('should call crypto once', () => {
    const randomSecret = mockMisc.randomSecret()
    assert.equal(randomSecret, 'randomBuffer')
  })
})

describe('misc.arrify', () => {
  let mockMisc
  before(async () => {
    mockMisc = await mockMiscModule()
  })

  after(() => {
    esmock.purge(mockMisc)
  })

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
      mockMisc.arrify({ mail: '' }),
      { mail: [] }
    )
  })

  it('arrify should transform { "username" : "johndoe" }' +
  ' in { "username" : ["johndoe"] }', () => {
    assert.deepEqual(
      mockMisc.arrify({ username: 'johndoe' }),
      { username: ['johndoe'] }
    )
  })

  it('arrify should transform ' +
  '{ "mail" : [ "business@mail.com" , "personal@mail.com"] }' +
  ' in { "mail" : [ "business@mail.com" , "personal@mail.com"] }', () => {
    assert.deepEqual(
      mockMisc.arrify({
        mail:
      ['business@mail.com', 'personal@mail.com']
      }),
      { mail: ['business@mail.com', 'personal@mail.com'] }
    )
  })

  it(' { "job" : [{"company":"gluu"}, {"role":"devops"}] } ' +
  'in { "job" : ["{"company":"gluu"}", "{"role":"devops"}"] }', () => {
    assert.deepEqual(
      mockMisc.arrify(
        { job: [{ company: 'gluu' }, { role: 'devops' }] }
      ),
      { job: ['{"company":"gluu"}', '{"role":"devops"}'] }
    )
  })

  it(' { "mail" : { "gmail" : "johndoe@gmail.com" } } ' +
  'in { "mail" : ["{"gmail" : "johndoe@gmail.com"}"] }', () => {
    assert.deepEqual(
      mockMisc.arrify({ mail: { gmail: 'johndoe@gmail.com' } }),
      { mail: ['{"gmail":"johndoe@gmail.com"}'] }
    )
  })

  it(' { profiles : [] } --> { profiles : [] }', () => {
    assert.deepEqual(
      mockMisc.arrify({ profiles: [] }),
      { profiles: [] }
    )
  })

  it(' { profiles : undefined } --> { profiles : [] }', () => {
    assert.deepEqual(
      mockMisc.arrify({ profiles: undefined }),
      { profiles: [] }
    )
  })

  it(' { profiles : null } --> { profiles : [] }', () => {
    assert.deepEqual(
      mockMisc.arrify({ profiles: null }),
      { profiles: [] }
    )
  })

  // Object members which are functions are dropped
  it(' { key: function() { return 0; }, key2: "hi" } --> { key2: ["hi"] }',
    () => {
      assert.deepEqual(
        mockMisc.arrify({ key: function () { return 0 }, key2: 'hi' }),
        { key2: ['hi'] }
      )
    })
})
