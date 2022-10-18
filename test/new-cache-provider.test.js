const { assert } = require('chai')
const cacheProvider = require('../server/utils/new-cache-provider')

describe('cache-provider', () => {
  describe('get', () => {
    // should implement new passport-saml object with async functions
    it('should have saveAsync', () => {
      const provider = cacheProvider.get('redis', {}, 60)
      assert.exists(provider.saveAsync)
    })
    it('should have getAsync', () => {
      const provider = cacheProvider.get('redis', {}, 60)
      assert.exists(provider.getAsync)
    })
    it('should have removeAsync', () => {
      const provider = cacheProvider.get('redis', {}, 60)
      assert.exists(provider.removeAsync)
    })
    describe('saveAsync', () => {
      it('should be a function', () => {
        const provider = cacheProvider.get('redis', {}, 60)
        assert.typeOf(provider.saveAsync, 'function')
      })
    })
    describe('getAsync', () => {
      it('should be a function', () => {
        const provider = cacheProvider.get('redis', {}, 60)
        assert.typeOf(provider.getAsync, 'function')
      })
    })
    describe('removeAsync', () => {
      it('should be a function', () => {
        const provider = cacheProvider.get('redis', {}, 60)
        assert.typeOf(provider.removeAsync, 'function')
      })
    })
  })
})
