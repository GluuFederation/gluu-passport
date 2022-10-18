const { createClient } = require('redis')

function redisCacheProviderAdapter (options, expiration) {
  createClient(options)
}

module.exports = { redisCacheProviderAdapter }
