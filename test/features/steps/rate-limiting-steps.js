const { Given, When, Then } = require('cucumber')
const got = require('got')
const chai = require('chai')
const config = require('config')

const assert = chai.assert
const { rateLimiter } = require('../../../server/utils/rate-limiter')
const port = config.get('passportConfigAuthorizedResponse').conf.serverWebPort

Given('rate limit is {int} in {int}', { timeout: 600 * 1000 }, async (rateLimitMax, rateLimitWindowMs) => {
  const app = require('../../../server/app')
  app.close()

  const appStart = new Promise((resolve, reject) => {
    app.listen(port, () => {
      rateLimiter.resetKey('::ffff:127.0.0.1')
      console.log('New Server started...')
      resolve()
    })
  })

  await appStart
})

When('{string} is requested {int} times in less then {int} by the same client', async (endpoint, requestsCount, rateLimitMax) => {
  for (let i = 1; i <= requestsCount; i++) {
    this.lastResponse = await got(`http://127.0.0.1:${port}/passport${endpoint}`, { retry: 0, throwHttpErrors: false })
  }
})

Then('last request response should have status code {int}', async (responseStatusCode) => {
  assert.equal(this.lastResponse.statusCode, responseStatusCode,
    `response.statusCode is NOT ${responseStatusCode}`)
})

Then('response body should be "{string}"', async (responseBody) => {
  assert.equal(this.lastResponse.body, responseBody)
})
