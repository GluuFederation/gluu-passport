
const sinon = require('sinon')
const { assert } = require('chai')
const redis = require('redis')

describe('redis-cache-provider', () => {
  let sandbox
  let createClientStub
  let connectSpy
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    connectSpy = sandbox.spy()
    createClientStub = sandbox.stub(redis, 'createClient').callsFake(() => {
      return {
        connect: connectSpy
        // connect: async () => { }
      }
    })
  })
  afterEach(async () => {
    sandbox.restore()
  })
  it('should call createClient with options', async () => {
    const anyOptions = {
      any: 'any',
      options: 'options'
    }
    const { redisCacheProviderAdapter } = require('../server/utils/redis-cache-provider')
    await redisCacheProviderAdapter(anyOptions, 100)
    assert.isTrue(createClientStub.calledWith(anyOptions))
  })
  it('should call connect', async () => {
    const { redisCacheProviderAdapter } = require('../server/utils/redis-cache-provider')
    await redisCacheProviderAdapter({}, 100)
    assert.equal(connectSpy.callCount, 1)
  })
})
