import chai from 'chai'
import config from 'config'
import redis from 'redis'
import fakeredis from 'fakeredis'
import esmock from 'esmock'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')

const mockCacheProvider = async () => {
  return await esmock('../server/cache-provider.js', {
    redis: fakeredis
  })
}

describe('cache provider test', () => {
  let redisCacheProvider, retryStrategy, testProvider

  before(async () => {
    redisCacheProvider = await mockCacheProvider()
    retryStrategy = redisCacheProvider.retryStrategy

    testProvider = JSON.parse(JSON.stringify(passportConfigAuthorizedResponse.providers.find(provider => provider.id === 'saml-redis-test')))
    testProvider.options.retry_strategy = retryStrategy
  })

  after(() => esmock.purge(redisCacheProvider))

  describe('test createClient', () => {
    it('redis is not live so we should get connection error response', () => {
      const client = redis.createClient(testProvider.options)

      client.on('ready', () => {
        assert.fail('redis connection should not work')
      })
      client.on('error', actualError => {
        const expectedError = new Error('Redis connection in broken state: retry aborted.')
        assert.equal(actualError.message, expectedError.message)
      })
    })

    it('redis is live so we should get connection', () => {
      const client = fakeredis.createClient(testProvider.options)

      client.on('error', actualError => {
        assert.fail('redis connection should work')
      })
    })
  })

  describe('test retryStrategy', () => {
    it('should return correct error message when ECONNREFUSED', () => {
      const options = {
        error: {
          code: 'ECONNREFUSED'
        }
      }
      assert.equal(redisCacheProvider.retryStrategy(options).message, 'The redis server refused the connection')
    })

    it('should return correct error message when total_retry_time > 1000 * 60 * 60', () => {
      const options = {
        total_retry_time: 1000 * 60 * 61
      }
      assert.equal(redisCacheProvider.retryStrategy(options).message, 'Redis connection retry time exhausted')
    })

    it('should return undefined when attempt > 10', () => {
      const options = {
        attempt: 11
      }
      assert.equal(redisCacheProvider.retryStrategy(options), undefined)
    })

    it('should return correct miliseconds', () => {
      const options = {
        attempt: 5
      }
      assert.equal(redisCacheProvider.retryStrategy(options), Math.min(options.attempt * 100, 3000))
    })
  })

  describe('test getRedisProvider', () => {
    let redisHandlers

    before(() => {
      redisHandlers = redisCacheProvider.getRedisProvider({ retry_strategy: retryStrategy }, 3600000)
    })

    it('getRedisProvider should return cache handlers', () => {
      assert.exists(redisHandlers.save, 'Failed to initialize redis provider save handler')
      assert.exists(redisHandlers.get, 'Failed to initialize redis provider get handler')
      assert.exists(redisHandlers.remove, 'Failed to initialize redis provider remove handler')
    })

    it('should set correct values', async () => {
      // eslint-disable-next-line node/handle-callback-err
      redisHandlers.save('test_key', 'test_value', function (err, value) {
        assert.exists(value)
        assert.equal(value, 'test_value')
        assert.isNull(err)
      })
    })

    it('should get correct values', async () => {
      // eslint-disable-next-line node/handle-callback-err
      redisHandlers.get('test_key', function (err, value) {
        assert.exists(value)
        assert.equal(value, 'test_value')
        assert.isNull(err)
      })
    })

    it('should remove correct values', async () => {
      // eslint-disable-next-line node/handle-callback-err
      redisHandlers.remove('test_key', function (err, key) {
        assert.exists(key)
        assert.equal(key, 'test_key')
        assert.isNull(err)
      })
    })
  })
})
