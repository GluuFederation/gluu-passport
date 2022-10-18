const { createClient } = require('redis')

async function redisCacheProviderAdapter (options, expiration) {
  const client = createClient(options)
  console.log(client)
  await client.connect()
}

module.exports = { redisCacheProviderAdapter }
