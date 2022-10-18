const { assert } = require('chai')
const cacheProvider = require('../server/utils/new-cache-provider')

describe('cache-provider', () => {
  describe('get', () => {
    it('should have saveAsync', () => {
      const provider = cacheProvider.get('redis', {}, 60)
      assert.exists(provider.saveAsync)
    })
  })
})
