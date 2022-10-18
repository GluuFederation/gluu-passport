
const sinon = require('sinon')
const { assert } = require('chai')
const redis = require('redis')
// const { redisCacheProviderAdapter } = require('../server/utils/redis-cache-provider')

describe('redis-cache-provider', () => {
  let sandbox
  let createClientStub
  let connectSpy
  let redisCacheProviderAdapter
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    connectSpy = sandbox.spy()
    createClientStub = sandbox.stub(redis, 'createClient').callsFake(() => {
      return {
        connect: connectSpy
        // connect: async () => { }
      }
    })
    redisCacheProviderAdapter = require('../server/utils/redis-cache-provider').redisCacheProviderAdapter
  })
  afterEach(async () => {
    sandbox.restore()
  })
  it('should call createClient with options', async () => {
    const anyOptions = {
      any: 'any',
      options: 'options'
    }
    // const { redisCacheProviderAdapter } = require('../server/utils/redis-cache-provider')
    await redisCacheProviderAdapter(anyOptions, 100)
    assert.isTrue(createClientStub.calledWith(anyOptions))
  })
  it('should call connect', async () => {
    // const { redisCacheProviderAdapter } = require('../server/utils/redis-cache-provider')
    await redisCacheProviderAdapter({}, 100)
    assert.equal(connectSpy.callCount, 1)
  })
  it('should return get', async () => {
    const client = await redisCacheProviderAdapter(undefined, 1600)
    assert.exists(client.get)
  })
  it('should return set', async () => {
    const client = await redisCacheProviderAdapter(undefined, 1600)
    assert.exists(client.get)
  })
  it('should return del', async () => {
    const client = await redisCacheProviderAdapter(undefined, 1600)
    assert.exists(client.get)
  })
  it('should return null when client return null string', async () => {
    sandbox.restore()
    sandbox.stub(redis, 'createClient').callsFake(() => {
      return {
        connect: connectSpy,
        get: async () => { return null }
      }
    })
    const client = await redisCacheProviderAdapter(undefined, 1600)
    console.log(client.get('any'))
  })
})
