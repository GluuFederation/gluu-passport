const redis = require('redis')
const sinon = require('sinon')
const { assert } = require('chai')

describe('redis-cache-provider', () => {
  it('should call createClient with options', () => {
    const createClientStub = sinon.stub(redis, 'createClient')
    const anyOptions = {
      any: 'any',
      options: 'options'
    }
    const { redisCacheProviderAdapter } = require('../server/utils/redis-cache-provider')

    redisCacheProviderAdapter(anyOptions, 100)
    assert.isTrue(createClientStub.calledWith(anyOptions))
  })
})
