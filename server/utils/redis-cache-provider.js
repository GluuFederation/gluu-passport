const { createClient } = require('redis')

async function redisCacheProviderAdapter (options, expiration) {
  const client = createClient(options)
  await client.connect()
  return {
    get: async (key) => { await client.get(key) },
    set: client.set,
    del: client.del
  }
  // return {
  //   get: (key) => {
  //     const value = client.get(key)
  //     if (value === 'null') {
  //       return null
  //     } else {
  //       return value
  //     }
  //   },
  //   set: async (key, value) => {
  //     const response = await client.set(key, value, { EX: expiration })
  //     if (response === 'OK') {
  //       return value
  //     }
  //     console.log(response)
  //   },
  //   del: async (key) => {
  //     const response = await client.del(key)
  //     if (response === 0) {
  //       return null
  //     } else { return key }
  //   }
  // }
}

module.exports = { redisCacheProviderAdapter }
