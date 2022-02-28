import chai from 'chai'
import config from 'config'
import redis from 'redis'
import fakeredis from 'fakeredis'
import * as cacheProviders from '../server/cache-provider.js'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')

describe('cache provider test', () => {
  const retryStrategy = cacheProviders.retryStrategy
  const testProvider = JSON.parse(JSON.stringify(passportConfigAuthorizedResponse.providers.find(provider => provider.id === 'saml-redis-test')))
  testProvider.options.retry_strategy = retryStrategy

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

  it('getRedisProvider should return cache handlers', () => {
    const getRedisProvider = cacheProviders.getRedisProvider
    const redisHandlers = getRedisProvider(testProvider.options, 100)
    assert.exists(redisHandlers.save, 'Failed to initialize redis provider save handler')
    assert.exists(redisHandlers.get, 'Failed to initialize redis provider get handler')
    assert.exists(redisHandlers.remove, 'Failed to initialize redis provider remove handler')
  })

  describe('test retryStrategy', () => {
    it('should return correct error message when ECONNREFUSED', () => {
      const options = {
        error: {
          code: 'ECONNREFUSED'
        }
      }
      assert.equal(cacheProviders.retryStrategy(options).message, 'The redis server refused the connection')
    })

    it('should return correct error message when total_retry_time > 1000 * 60 * 60', () => {
      const options = {
        total_retry_time: 1000 * 60 * 61
      }
      assert.equal(cacheProviders.retryStrategy(options).message, 'Redis connection retry time exhausted')
    })

    it('should return undefined when attempt > 10', () => {
      const options = {
        attempt: 11
      }
      assert.equal(cacheProviders.retryStrategy(options), undefined)
    })

    it('should return correct miliseconds', () => {
      const options = {
        attempt: 5
      }
      assert.equal(cacheProviders.retryStrategy(options), Math.min(options.attempt * 100, 3000))
    })
  })
})
